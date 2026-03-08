import { NotificationType } from '@prisma/client';
import prisma from '../config/database';

export class NotificationsService {
  /**
   * Create a notification for a specific user
   */
  async createNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    customerId?: string;
    organizationId?: string;
  }) {
    return prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        customerId: data.customerId,
        organizationId: data.organizationId,
      },
    });
  }

  /**
   * Create notifications for multiple users
   */
  async createNotificationsForUsers(data: {
    type: NotificationType;
    title: string;
    message: string;
    userIds: string[];
    customerId?: string;
    organizationId?: string;
  }) {
    const notifications = data.userIds.map((userId) => ({
      type: data.type,
      title: data.title,
      message: data.message,
      userId,
      customerId: data.customerId,
      organizationId: data.organizationId,
    }));

    return prisma.notification.createMany({
      data: notifications,
    });
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    organizationId: string | null,
    options: { limit?: number; onlyUnread?: boolean } = {}
  ) {
    const { limit = 50, onlyUnread = false } = options;

    const where: any = { userId };

    if (onlyUnread) {
      where.isRead = false;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string, organizationId: string | null) {
    const where: any = {
      userId,
      isRead: false,
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return prisma.notification.count({ where });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });
  }

  /**
   * Delete all notifications for a user (Mark all read removes all notifications)
   */
  async markAllAsRead(userId: string, organizationId: string | null) {
    const where: any = {
      userId,
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Delete all notifications for this user
    return prisma.notification.deleteMany({
      where,
    });
  }

  /**
   * Get users to notify for a new lead (admin, superadmin, and assigned connector)
   */
  async getUsersForNewLeadNotification(
    organizationId: string,
    connectorId?: string
  ): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        role: { in: ['admin', 'superadmin'] },
      },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    // Add connector if assigned
    if (connectorId && !userIds.includes(connectorId)) {
      userIds.push(connectorId);
    }

    return userIds;
  }

  /**
   * Get users to notify for a remark update
   * Only notifies: assigned connector (channel partner), lead owner, and superadmins
   */
  async getUsersForRemarkNotification(
    organizationId: string,
    connectorId?: string,
    leadOwnerId?: string,
    excludeUserId?: string
  ): Promise<string[]> {
    // Get only superadmins (not all admins)
    const superadmins = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        role: 'superadmin',
      },
      select: { id: true },
    });

    let userIds = superadmins.map((u) => u.id);

    // Add specific lead owner (admin) if assigned
    if (leadOwnerId && !userIds.includes(leadOwnerId)) {
      userIds.push(leadOwnerId);
    }

    // Add specific connector (channel partner) if assigned
    if (connectorId && !userIds.includes(connectorId)) {
      userIds.push(connectorId);
    }

    // Exclude the user who made the change (they don't need to be notified)
    if (excludeUserId) {
      userIds = userIds.filter((id) => id !== excludeUserId);
    }

    return userIds;
  }

  /**
   * Notify users about a new lead
   */
  async notifyNewLead(
    customerName: string,
    creatorName: string,
    organizationId: string,
    customerId: string,
    connectorId?: string
  ) {
    const userIds = await this.getUsersForNewLeadNotification(
      organizationId,
      connectorId
    );

    if (userIds.length === 0) return;

    await this.createNotificationsForUsers({
      type: 'new_lead',
      title: 'New Lead Added',
      message: `${creatorName} added a new lead: ${customerName}`,
      userIds,
      customerId,
      organizationId,
    });
  }

  /**
   * Notify users about a remark update
   * Notifies: assigned connector (channel partner), lead owner, and superadmins
   */
  async notifyRemarkAdded(
    customerName: string,
    updaterName: string,
    remark: string,
    organizationId: string,
    customerId: string,
    connectorId?: string,
    leadOwnerId?: string,
    excludeUserId?: string
  ) {
    const userIds = await this.getUsersForRemarkNotification(
      organizationId,
      connectorId,
      leadOwnerId,
      excludeUserId
    );

    if (userIds.length === 0) return;

    // Truncate remark if too long
    const truncatedRemark = remark.length > 100 ? remark.substring(0, 100) + '...' : remark;

    await this.createNotificationsForUsers({
      type: 'remark_added',
      title: 'Remark Added',
      message: `${updaterName} added a remark on ${customerName}: "${truncatedRemark}"`,
      userIds,
      customerId,
      organizationId,
    });
  }
}
