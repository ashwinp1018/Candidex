import InterviewSession from '../models/InterviewSession.js';
import { generateQuestions, evaluateAnswers } from '../utils/aiClient.js';

/**
 * @route   POST /api/interview/start
 * @desc    Start a new interview session
 * @access  Private
 */
export const startInterview = async (req, res, next) => {
  try {
    const { role, difficulty } = req.body;

    // Validate input
    if (!role || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide role and difficulty',
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Difficulty must be one of: easy, medium, hard',
      });
    }

    // Generate questions using AI (with automatic fallback)
    const questionResult = await generateQuestions(role, difficulty.toLowerCase());
    const questions = questionResult.questions;

    // Create interview session
    const interviewSession = await InterviewSession.create({
      userId: req.user._id,
      role,
      difficulty: difficulty.toLowerCase(),
      questions,
    });

    // Log AI usage metadata (internal only, not exposed in API)
    if (questionResult.model) {
      interviewSession.aiUsage.push({
        model: questionResult.model,
        promptType: 'question_generation',
        timestamp: new Date(),
      });
      await interviewSession.save();
    } else if (questionResult.usedFallback) {
      // Log fallback usage internally
      console.log(`[AI_USAGE] Interview ${interviewSession._id}: Used fallback for question generation`);
    }

    res.status(201).json({
      success: true,
      message: 'Interview session started successfully',
      data: {
        sessionId: interviewSession._id,
        role: interviewSession.role,
        difficulty: interviewSession.difficulty,
        questions: interviewSession.questions,
        createdAt: interviewSession.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/interview/submit
 * @desc    Submit interview answers and get evaluation
 * @access  Private
 */
export const submitInterview = async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;

    // Validate input
    if (!sessionId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sessionId and answers',
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be an array',
      });
    }

    // Find interview session
    const interviewSession = await InterviewSession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });

    if (!interviewSession) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found',
      });
    }

    // Validate answer count matches question count
    if (answers.length !== interviewSession.questions.length) {
      return res.status(400).json({
        success: false,
        message: `Expected ${interviewSession.questions.length} answers, got ${answers.length}`,
      });
    }

    // Evaluate answers using AI (with automatic fallback)
    const evaluationResult = await evaluateAnswers(
      interviewSession.role,
      interviewSession.difficulty,
      interviewSession.questions,
      answers
    );
    const evaluation = evaluationResult.evaluation;

    // Validate per-question evaluations array length matches number of questions
    if (evaluation.perQuestionEvaluations && evaluation.perQuestionEvaluations.length !== interviewSession.questions.length) {
      return res.status(500).json({
        success: false,
        message: 'Evaluation error: per-question evaluations count mismatch',
      });
    }

    // Calculate overall score as average of the three scores
    const overallScore = Math.round(
      (evaluation.clarityScore + evaluation.correctnessScore + evaluation.communicationScore) / 3
    );

    // Compute strongest and weakest question indices based on per-question averages
    let strongestQuestionIndex = null;
    let weakestQuestionIndex = null;

    if (
      Array.isArray(evaluation.perQuestionEvaluations) &&
      evaluation.perQuestionEvaluations.length === interviewSession.questions.length
    ) {
    
      // Calculate average scores for each question
      const questionAverages = evaluation.perQuestionEvaluations.map((qEval, index) => {
        const avg = (qEval.clarityScore + qEval.correctnessScore + qEval.communicationScore) / 3;
        return { index, average: avg };
      });

      // Find strongest (highest average)
      const strongest = questionAverages.reduce((max, current) => 
        current.average > max.average ? current : max
      );
      strongestQuestionIndex = strongest.index;

      // Find weakest (lowest average)
      const weakest = questionAverages.reduce((min, current) => 
        current.average < min.average ? current : min
      );
      weakestQuestionIndex = weakest.index;
    }

    // Update interview session
    interviewSession.answers = answers;
    interviewSession.evaluation = evaluation;
    interviewSession.overallScore = overallScore;
    interviewSession.strongestQuestionIndex = strongestQuestionIndex;
    interviewSession.weakestQuestionIndex = weakestQuestionIndex;

    // Log AI usage metadata (internal only, not exposed in API)
    if (evaluationResult.model) {
      interviewSession.aiUsage.push({
        model: evaluationResult.model,
        promptType: 'evaluation',
        timestamp: new Date(),
      });
    } else if (evaluationResult.usedFallback) {
      // Log fallback usage internally
      console.log(`[AI_USAGE] Interview ${interviewSession._id}: Used fallback for evaluation`);
    }

    await interviewSession.save();

    res.status(200).json({
      success: true,
      message: 'Interview submitted successfully',
      data: {
        sessionId: interviewSession._id,
        overallScore: interviewSession.overallScore,
        evaluation: interviewSession.evaluation,
        submittedAt: interviewSession.updatedAt || new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/interview/history
 * @desc    Get interview history for logged-in user
 * @access  Private
 */
export const getInterviewHistory = async (req, res, next) => {
  try {
    // Extract user ID from req.user (set by auth middleware)
    const userId = req.user._id;

    // Query interview sessions for the user, sorted by createdAt descending
    const sessions = await InterviewSession.find({ userId })
      .select('role difficulty overallScore createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/interview/analytics
 * @desc    Get interview analytics for logged-in user
 * @access  Private
 */
export const getInterviewAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all completed interviews (with overallScore)
    const completedInterviews = await InterviewSession.find({
      userId,
      overallScore: { $exists: true, $ne: null },
    }).select('overallScore evaluation createdAt');

    if (completedInterviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalInterviews: 0,
          averageScore: 0,
          strongestSkill: null,
          lastFiveScores: [],
          improvementTrend: 'stable',
        },
      });
    }

    // Calculate total interviews
    const totalInterviews = completedInterviews.length;

    // Calculate average score
    const totalScore = completedInterviews.reduce((sum, session) => sum + session.overallScore, 0);
    const averageScore = Math.round((totalScore / totalInterviews) * 100) / 100;

    // Calculate strongest skill (average of clarity, correctness, communication across all interviews)
    const skillTotals = {
      clarity: 0,
      correctness: 0,
      communication: 0,
    };

    completedInterviews.forEach((session) => {
      if (session.evaluation) {
        skillTotals.clarity += session.evaluation.clarityScore || 0;
        skillTotals.correctness += session.evaluation.correctnessScore || 0;
        skillTotals.communication += session.evaluation.communicationScore || 0;
      }
    });

    const skillAverages = {
      clarity: skillTotals.clarity / totalInterviews,
      correctness: skillTotals.correctness / totalInterviews,
      communication: skillTotals.communication / totalInterviews,
    };

    const strongestSkill = Object.entries(skillAverages).reduce(
      (max, [skill, avg]) => (avg > max.average ? { skill, average: avg } : max),
      { skill: null, average: -Infinity }
    ).skill;
    
    // Get last five scores (sorted by createdAt descending)
    const sortedByDate = [...completedInterviews].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    const lastFiveScores = sortedByDate.slice(0, 5).map(session => ({
      score: session.overallScore,
      date: session.createdAt,
    }));

    // Calculate improvement trend
    let improvementTrend = 'stable';

if (completedInterviews.length >= 4) {
  const midpoint = Math.floor(completedInterviews.length / 2);

  const older = completedInterviews.slice(0, midpoint);
  const recent = completedInterviews.slice(midpoint);

  const avg = arr =>
    arr.reduce((sum, s) => sum + s.overallScore, 0) / arr.length;

  const olderAvg = avg(older);
  const recentAvg = avg(recent);

  if (recentAvg > olderAvg + 5) improvementTrend = 'improving';
  else if (recentAvg < olderAvg - 5) improvementTrend = 'declining';
}


    res.status(200).json({
      success: true,
      data: {
        totalInterviews,
        averageScore,
        strongestSkill,
        lastFiveScores,
        improvementTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};