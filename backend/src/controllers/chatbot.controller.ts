import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot.service';

const chatbotService = new ChatbotService();

export class ChatbotController {
  /**
   * Process user query
   * POST /api/chatbot/query
   */
  async query(req: Request, res: Response) {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Query is required and must be a non-empty string',
        });
      }

      // Get user info from authenticated request
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
        });
      }

      // Process query
      const result = await chatbotService.processQuery({
        query: query.trim(),
        userId,
        userRole,
      });

      return res.json({
        success: !result.error,
        response: result.response,
        data: result.data,
      });
    } catch (error: any) {
      console.error('Chatbot query error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * Get suggested queries
   * GET /api/chatbot/suggestions
   */
  async getSuggestions(req: Request, res: Response) {
    try {
      const suggestions = chatbotService.getSuggestions();
      return res.json({
        success: true,
        data: suggestions,
      });
    } catch (error: any) {
      console.error('Get suggestions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Health check for chatbot service
   * GET /api/chatbot/health
   */
  async health(req: Request, res: Response) {
    try {
      const enabled = process.env.CHATBOT_ENABLED === 'true' && !!process.env.OPENAI_API_KEY;
      return res.json({
        success: true,
        data: {
          enabled,
          model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export const chatbotController = new ChatbotController();
