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
 * @returns {Object} Evaluation object with structured metrics
 */
const generateMockEvaluation = (answers) => {
  // Mock scoring logic - in production, this would use AI
  // Generate random scores between 50-95 based on answer quality
  const answerQuality = answers.map((answer) => {
    if (!answer || answer.trim().length < 10) return 0.3;
    if (answer.length < 50) return 0.5;
    if (answer.length < 150) return 0.75;
    return 1.0;
  });

  const averageQuality = answerQuality.reduce((a, b) => a + b, 0) / answerQuality.length;
  const baseScore = Math.round(50 + averageQuality * 45);

  // Generate individual scores with some variation
  const clarityScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 20) - 10));
  const correctnessScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 20) - 10));
  const communicationScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 20) - 10));

  // Calculate overall score as average of the three scores
  const overallScore = Math.round((clarityScore + correctnessScore + communicationScore) / 3);

  // Generate strengths based on score
  const strengths = [];
  if (clarityScore >= 70) {
    strengths.push('Clear and articulate communication');
  }
  if (correctnessScore >= 70) {
    strengths.push('Strong technical knowledge and accuracy');
  }
  if (communicationScore >= 70) {
    strengths.push('Effective explanation of concepts');
  }
  if (strengths.length === 0) {
    strengths.push('Demonstrated effort in responses');
  }

  // Generate areas for improvement
  const areasForImprovement = [];
  if (clarityScore < 70) {
    areasForImprovement.push('Work on articulating thoughts more clearly');
  }
  if (correctnessScore < 70) {
    areasForImprovement.push('Enhance technical accuracy and depth');
  }
  if (communicationScore < 70) {
    areasForImprovement.push('Improve communication and explanation skills');
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push('Continue practicing to maintain high performance');
  }

  // Generate overall feedback
  let overallFeedback = '';
  if (overallScore >= 85) {
    overallFeedback = 'Excellent performance! You demonstrated strong knowledge, clear communication, and accurate responses. Keep up the great work!';
  } else if (overallScore >= 70) {
    overallFeedback = 'Good performance overall. You showed solid understanding and communication skills. With continued practice, you can reach an excellent level.';
  } else if (overallScore >= 60) {
    overallFeedback = 'Adequate performance. There is room for improvement in clarity, correctness, and communication. Focus on providing more detailed and structured answers.';
  } else {
    overallFeedback = 'Your responses need improvement. Focus on providing more detailed answers, enhancing technical accuracy, and improving communication clarity.';
  }

  return {
    clarityScore,
    correctnessScore,
    communicationScore,
    strengths,
    areasForImprovement,
    overallFeedback,
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

    // Calculate overall score as average of the three scores
    const overallScore = Math.round(
      (evaluation.clarityScore + evaluation.correctnessScore + evaluation.communicationScore) / 3
    );

    // Update interview session
    interviewSession.answers = answers;
    interviewSession.evaluation = evaluation;
    interviewSession.overallScore = overallScore;
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