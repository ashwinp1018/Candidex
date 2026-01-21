import InterviewSession from '../models/InterviewSession.js';

/**
 * Generate mock questions based on role and difficulty
 * @param {string} role - Job role
 * @param {string} difficulty - Difficulty level
 * @returns {Array<string>} Array of questions
 */
const generateMockQuestions = (role, difficulty) => {
  const questionTemplates = {
    easy: [
      `Tell me about yourself and why you're interested in ${role}.`,
      `What do you know about our company?`,
      `What are your strengths as a ${role}?`,
      `Where do you see yourself in 5 years?`,
      `Why should we hire you for this ${role} position?`,
    ],
    medium: [
      `Describe a challenging project you worked on as a ${role}. How did you handle it?`,
      `How do you stay updated with the latest trends in ${role}?`,
      `Can you explain a time when you had to work under pressure?`,
      `What tools and technologies are you most comfortable with in ${role}?`,
      `How do you handle feedback and criticism?`,
    ],
    hard: [
      `Design a scalable system for [specific ${role} challenge]. Walk me through your approach.`,
      `How would you optimize [specific ${role} problem]? Discuss trade-offs.`,
      `Describe a time when you had to make a difficult technical decision. What was your process?`,
      `How do you approach debugging complex issues in ${role}?`,
      `Explain how you would mentor a junior ${role} and help them grow.`,
    ],
  };

  return questionTemplates[difficulty] || questionTemplates.medium;
};

/**
 * Generate mock evaluation based on answers
 * @param {Array<string>} answers - User's answers
 * @returns {Object} Evaluation object with score and feedback
 */
const generateMockEvaluation = (answers) => {
  // Mock scoring logic - in production, this would use AI
  const baseScore = 60;
  const answerQuality = answers.map((answer) => {
    if (!answer || answer.trim().length < 10) return 0.5;
    if (answer.length < 50) return 0.7;
    if (answer.length < 150) return 0.85;
    return 1.0;
  });

  const averageQuality = answerQuality.reduce((a, b) => a + b, 0) / answerQuality.length;
  const overallScore = Math.round(baseScore + averageQuality * 40);

  const feedback = {
    strengths: [
      'Good communication skills',
      'Clear understanding of concepts',
      'Well-structured responses',
    ],
    areasForImprovement: [
      'Could provide more specific examples',
      'Consider elaborating on technical details',
      'Practice articulating complex ideas more concisely',
    ],
    overallFeedback: `You demonstrated solid knowledge and communication skills. Your answers were ${overallScore >= 80 ? 'excellent' : overallScore >= 65 ? 'good' : 'adequate'}. Continue practicing to improve your interview performance.`,
  };

  return {
    score: overallScore,
    feedback,
    answerQuality: answerQuality.map((q, i) => ({
      questionIndex: i,
      quality: q,
    })),
  };
};

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

    // Generate mock questions
    const questions = generateMockQuestions(role, difficulty.toLowerCase());

    // Create interview session
    const interviewSession = await InterviewSession.create({
      userId: req.user._id,
      role,
      difficulty: difficulty.toLowerCase(),
      questions,
    });

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

    // Generate mock evaluation
    const evaluation = generateMockEvaluation(answers);

    // Update interview session
    interviewSession.answers = answers;
    interviewSession.evaluation = evaluation;
    interviewSession.overallScore = evaluation.score;
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
