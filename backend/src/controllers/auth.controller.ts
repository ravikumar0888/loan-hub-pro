import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

export class AuthController {
  /**
   * Login endpoint
   * Validates credentials and returns JWT token
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organization: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          error: 'Your account has been deactivated. Please contact support.',
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      // Check organization status (if not master_admin)
      if (user.role !== 'master_admin' && user.organization) {
        if (user.organization.status === 'suspended') {
          res.status(403).json({
            success: false,
            error: 'Your organization subscription is suspended. Please contact billing.',
          });
          return;
        }
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Return user data and token
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            role: user.role,
            profilePhoto: user.profilePhoto,
            companyName: user.companyName,
            companyEmail: user.companyEmail,
            companyAddress: user.companyAddress,
            companyGSTIN: user.companyGSTIN,
            companyState: user.companyState,
            companyStateCode: user.companyStateCode,
            hsnSac: user.hsnSac,
            cgstRate: user.cgstRate,
            sgstRate: user.sgstRate,
            organizationId: user.organizationId,
            organization: user.organization ? {
              id: user.organization.id,
              name: user.organization.name,
              status: user.organization.status,
              pricingTier: user.organization.pricingTier,
            } : null,
          },
        },
        message: 'Login successful',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      next(error);
    }
  }

  /**
   * Get current authenticated user
   * Returns user data with organization info
   */
  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      // Fetch full user data with organization
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              status: true,
              pricingTier: true,
              logo: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobile: user.mobile,
          role: user.role,
          profilePhoto: user.profilePhoto,
          companyName: user.companyName,
          companyEmail: user.companyEmail,
          companyAddress: user.companyAddress,
          companyGSTIN: user.companyGSTIN,
          companyState: user.companyState,
          companyStateCode: user.companyStateCode,
          hsnSac: user.hsnSac,
          cgstRate: user.cgstRate,
          sgstRate: user.sgstRate,
          organizationId: user.organizationId,
          organization: user.organization,
        },
      });
    } catch (error: any) {
      console.error('Get current user error:', error);
      next(error);
    }
  }

  /**
   * Verify password for current authenticated user
   * Used for admin password protection feature
   */
  async verifyPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Password is required',
        });
        return;
      }

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid password',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Password verified',
      });
    } catch (error: any) {
      console.error('Verify password error:', error);
      next(error);
    }
  }
}
