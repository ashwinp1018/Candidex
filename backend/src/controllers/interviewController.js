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

    // Calculate overall score as average of the three scores
    const overallScore = Math.round(
      (evaluation.clarityScore + evaluation.correctnessScore + evaluation.communicationScore) / 3
    );

    // Update interview session
    interviewSession.answers = answers;
    interviewSession.evaluation = evaluation;
    interviewSession.overallScore = overallScore;

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
        submittedAt: new Date(),
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