import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';

const router = Router();
const notificationsController = new NotificationsController();

// All routes require authentication and organization context
router.use(authenticate);
router.use(organizationContext);

// Get notifications for current user
router.get('/', notificationsController.getNotifications.bind(notificationsController));

// Get unread count for current user
router.get('/unread-count', notificationsController.getUnreadCount.bind(notificationsController));

// Mark a notification as read
router.put('/:id/read', notificationsController.markAsRead.bind(notificationsController));

// Mark all notifications as read
router.put('/mark-all-read', notificationsController.markAllAsRead.bind(notificationsController));

export default router;
