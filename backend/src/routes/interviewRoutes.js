import express from 'express';
import { startInterview, submitInterview, getInterviewHistory } from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/interview/start
 * @desc    Start a new interview session
 * @access  Private
 */
router.post('/start', protect, startInterview);

/**
 * @route   POST /api/interview/submit
 * @desc    Submit interview answers and get evaluation
 * @access  Private
 */
router.post('/submit', protect, submitInterview);

/**
 * @route   GET /api/interview/history
 * @desc    Get interview history for logged-in user
 * @access  Private
 */
router.get('/history', protect, getInterviewHistory);

export default router;
