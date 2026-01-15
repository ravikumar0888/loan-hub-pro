import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { NotificationsService } from '../services/notifications.service';

const notificationsService = new NotificationsService();

export class NotificationsController {
  /**
   * Get notifications for the current user
   */
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const onlyUnread = req.query.onlyUnread === 'true';

      const notifications = await notificationsService.getNotifications(
        userId,
        req.organizationId || null,
        { limit, onlyUnread }
      );

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get unread notification count for the current user
   */
  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const count = await notificationsService.getUnreadCount(
        userId,
        req.organizationId || null
      );

      res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;

      await notificationsService.markAsRead(id, userId);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read for the current user
   */
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      await notificationsService.markAllAsRead(userId, req.organizationId || null);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: any) {
      next(error);
    }
  }
}
