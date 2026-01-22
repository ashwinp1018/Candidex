/**
 * In-memory rate limiter for AI endpoints
 * Limits to 5 AI calls per minute per authenticated user
 */

// Store: userId -> array of timestamps
const userRequestTimestamps = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const oneMinuteAgo = Date.now() - 60000;
  for (const [userId, timestamps] of userRequestTimestamps.entries()) {
    const filtered = timestamps.filter(ts => ts > oneMinuteAgo);
    if (filtered.length === 0) {
      userRequestTimestamps.delete(userId);
    } else {
      userRequestTimestamps.set(userId, filtered);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware for AI endpoints
 * Limits to maxRequests per windowMs per user
 * @param {number} maxRequests - Maximum requests allowed (default: 5)
 * @param {number} windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 */
export const aiRateLimiter = (maxRequests = 5, windowMs = 60000) => {
  return (req, res, next) => {
    // Only apply to authenticated users
    if (!req.user || !req.user._id) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request timestamps
    let timestamps = userRequestTimestamps.get(userId) || [];
    
    // Filter out timestamps outside the window
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Maximum ${maxRequests} AI requests per minute. Please try again later.`,
      });
    }

    // Add current request timestamp
    timestamps.push(now);
    userRequestTimestamps.set(userId, timestamps);

    next();
  };
};
