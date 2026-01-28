import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden - Insufficient permissions'
      });
      return;
    }

    next();
  };
};
