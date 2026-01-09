import { Router } from 'express';
import { chatbotController } from '../controllers/chatbot.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All chatbot routes require authentication
router.use(authenticate);

/**
 * POST /api/chatbot/query
 * Process user query and return AI response
 * Access: Connector only (enforced in controller)
 */
router.post('/query', (req, res) => chatbotController.query(req, res));

/**
 * GET /api/chatbot/suggestions
 * Get suggested queries for users
 * Access: Authenticated users
 */
router.get('/suggestions', (req, res) => chatbotController.getSuggestions(req, res));

/**
 * GET /api/chatbot/health
 * Check if chatbot service is configured and enabled
 * Access: Authenticated users
 */
router.get('/health', (req, res) => chatbotController.health(req, res));

export default router;
