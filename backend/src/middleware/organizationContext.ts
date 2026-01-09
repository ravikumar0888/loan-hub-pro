import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

/**
 * Organization Context Middleware
 *
 * Injects organization context into the request for multi-tenancy.
 *
 * - master_admin: Can access all organizations (organizationId = null)
 * - superadmin/admin/backoffice/connector: Scoped to their organization
 *
 * This middleware MUST be used after authenticate middleware.
 */
export const organizationContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // master_admin has no organization restrictions
    if (req.user.role === 'master_admin') {
      req.organizationId = null; // null = access all organizations
      return next();
    }

    // Fetch user's organization from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'User not associated with any organization',
      });
    }

    // Inject organizationId into request
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    next(error);
  }
};
