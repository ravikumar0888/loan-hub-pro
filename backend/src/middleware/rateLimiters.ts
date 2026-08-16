import rateLimit from 'express-rate-limit';

// Strict rate limiting for login/password-reset — prevent brute-force
// credential guessing and reset-token enumeration abuse.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10,                   // Max 10 attempts per IP per 15 minutes
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts against the limit
});
