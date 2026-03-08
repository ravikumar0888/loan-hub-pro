import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

/**
 * Organization Context Middleware
 *
 * Injects organization context into the request for multi-tenancy.
 * organizationId is read from the JWT first (fast path).
 * Falls back to a DB lookup for tokens issued before this field was added.
 *
 * - master_admin: organizationId = null (access all organizations)
 * - superadmin/admin/backoffice/connector: scoped to their organization
 *
 * This middleware MUST be used after authenticate middleware.
 */
export const organizationContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Ensure user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  // master_admin has no organization restrictions
  if (req.user.role === 'master_admin') {
    req.organizationId = null;
    return next();
  }

  // Fast path: read organizationId from JWT payload
  let orgId = req.user.organizationId;

  // Fallback: old tokens don't have organizationId — fetch from DB
  if (!orgId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { organizationId: true },
      });
      orgId = user?.organizationId ?? null;
    } catch {
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve organization context',
      });
    }
  }

  if (!orgId) {
    return res.status(403).json({
      success: false,
      error: 'User not associated with any organization',
    });
  }

  req.organizationId = orgId;
  next();
};
