import express from 'express';
import { startInterview, submitInterview, getInterviewHistory, getInterviewAnalytics } from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/interview/start
 * @desc    Start a new interview session
 * @access  Private
 */
router.post('/start', protect, aiRateLimiter(), startInterview);

/**
 * @route   POST /api/interview/submit
 * @desc    Submit interview answers and get evaluation
 * @access  Private
 */
router.post('/submit', protect, aiRateLimiter(), submitInterview);

/**
 * @route   GET /api/interview/history
 * @desc    Get interview history for logged-in user
 * @access  Private
 */
router.get('/history', protect, getInterviewHistory);

/**
 * @route   GET /api/interview/analytics
 * @desc    Get interview analytics for logged-in user
 * @access  Private
 */
router.get('/analytics', protect, getInterviewAnalytics);

export default router;
