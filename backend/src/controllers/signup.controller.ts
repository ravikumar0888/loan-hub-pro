import { Response, NextFunction, Request } from 'express';
import { OrganizationsService } from '../services/organizations.service';
import { generateToken } from '../utils/jwt';

const organizationsService = new OrganizationsService();

export class SignupController {
  /**
   * Public endpoint for self-service organization signup
   * Creates organization + super admin user
   * Returns JWT token for immediate login
   */
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      // Map frontend field names to service field names
      const {
        organizationName,
        organizationEmail,
        organizationPhone,
        superAdminEmail,
        superAdminPassword,
        superAdminName,
        ...rest
      } = req.body;

      // Parse super admin name
      const nameParts = superAdminName?.split(' ') || [];
      const adminFirstName = nameParts[0] || 'Admin';
      const adminLastName = nameParts.slice(1).join(' ') || 'User';

      const organizationData = {
        name: organizationName,
        email: organizationEmail,
        phone: organizationPhone,
        adminEmail: superAdminEmail,
        adminPassword: superAdminPassword,
        adminFirstName,
        adminLastName,
        ...rest, // Include any other fields like address, website, pricingTier, seats
      };

      const organization = await organizationsService.createOrganization(organizationData);

      // Generate JWT token for the super admin
      const token = generateToken({
        userId: organization.superAdmin.id,
        email: organization.superAdmin.email,
        role: 'superadmin',
      });

      res.status(201).json({
        success: true,
        data: {
          organization: {
            id: organization.id,
            name: organization.name,
            status: organization.status,
            trialEndsAt: organization.trialEndsAt,
          },
          user: organization.superAdmin,
          token,
        },
        message: 'Organization created successfully! Your 14-day trial has started.',
      });
    } catch (error: any) {
      next(error);
    }
  }
}
