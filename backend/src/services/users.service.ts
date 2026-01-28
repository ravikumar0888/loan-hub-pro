import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { PAGINATION_DEFAULTS, PRICING_TIER_LIMITS } from '../config/constants';
import { PaginationQuery, UserRole } from '../types';

export class UsersService {
  async getUsers(query: PaginationQuery & { role?: UserRole; search?: string }, userId?: string, userRole?: string, organizationId?: string | null) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};


    // Multi-tenant filtering: filter by organizationId (except for master_admin)
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    // Role-based filtering for admin: show only users they created + their own entry
    if (userRole === 'admin' && userId) {
      where.OR = [
        { createdBy: userId }, // Users created by this admin
        { id: userId },        // Admin's own entry
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      // If admin filtering is already applied, we need to combine search with existing OR
      if (where.OR && userRole === 'admin') {
        // Combine admin filter with search filter
        const adminFilter = where.OR;
        where.AND = [
          { OR: adminFilter },
          {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { mobile: { contains: query.search } },
            ],
          },
        ];
        delete where.OR;
      } else {
        where.OR = [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { mobile: { contains: query.search } },
        ];
      }
    }


    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          role: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          userBankDetails: {
            include: {
              bank: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' }
        ],
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string, userRole?: string, organizationId?: string | null) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        profilePhoto: true,
        companyName: true,
        companyEmail: true,
        companyAddress: true,
        companyGSTIN: true,
        companyState: true,
        companyStateCode: true,
        hsnSac: true,
        cgstRate: true,
        sgstRate: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        userBankDetails: {
          include: {
            bank: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Multi-tenant check: ensure user belongs to the same organization
    if (userRole !== 'master_admin' && organizationId && user.organizationId !== organizationId) {
      throw new Error('Forbidden - User not found in your organization');
    }

    return user;
  }

  // Helper method to validate user limits based on pricing tier
  private async validateUserLimits(organizationId: string, newUserRole: string) {
    // Get the organization with its pricing tier
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { pricingTier: true, name: true },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const pricingTier = organization.pricingTier as keyof typeof PRICING_TIER_LIMITS;
    const tierLimits = PRICING_TIER_LIMITS[pricingTier];

    if (!tierLimits || !tierLimits.userLimits) {
      return; // No limits defined, skip validation
    }

    // Map role to the limit key
    const roleToLimitKey: Record<string, keyof typeof tierLimits.userLimits> = {
      superadmin: 'superadmin',
      admin: 'admin',
      backoffice: 'backoffice',
      connector: 'connector',
    };

    const limitKey = roleToLimitKey[newUserRole];
    if (!limitKey) {
      return; // Role not tracked, skip validation
    }

    const maxAllowed = tierLimits.userLimits[limitKey];

    // Count current users of this role in the organization
    const currentCount = await prisma.user.count({
      where: {
        organizationId,
        role: newUserRole as any,
        isActive: true,
      },
    });

    if (currentCount >= maxAllowed) {
      const roleDisplayName = newUserRole.charAt(0).toUpperCase() + newUserRole.slice(1);

      // Check if Enterprise plan with customizable option
      const tierLimitsAny = tierLimits as any;
      if (pricingTier === 'enterprise' && tierLimitsAny.isCustomizable && tierLimitsAny.addonPricing) {
        const addonPrice = tierLimitsAny.addonPricing[limitKey];
        throw new Error(
          `User limit reached: Your ${pricingTier} plan allows ${maxAllowed} ${roleDisplayName} users. ` +
          `Current count: ${currentCount}. Contact support to add more users at ₹${addonPrice}/month each.`
        );
      }

      throw new Error(
        `User limit reached: Your ${pricingTier} plan allows maximum ${maxAllowed} ${roleDisplayName} users. ` +
        `Current count: ${currentCount}. Please upgrade your plan to add more users.`
      );
    }
  }

  async createUser(data: any, userId?: string, userRole?: string, organizationId?: string | null) {
    // Role-based validation: Admins can only create connector and backoffice users
    if (userRole === 'admin') {
      if (data.role !== 'connector' && data.role !== 'backoffice') {
        throw new Error('Forbidden - Admins can only create Connector and BackOffice users');
      }
    }

    // Validate user limits based on organization's pricing tier
    if (organizationId && data.role !== 'master_admin') {
      await this.validateUserLimits(organizationId, data.role);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Check if mobile already exists
    const existingMobile = await prisma.user.findUnique({
      where: { mobile: data.mobile },
    });

    if (existingMobile) {
      throw new Error('Mobile number already exists');
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobile: data.mobile,
        passwordHash,
        role: data.role,
        organizationId: organizationId, // Assign organization to user
        createdBy: userId, // Track who created this user
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Add bank details if connector
    if (data.role === 'connector' && data.bankDetails && data.bankDetails.length > 0) {
      await prisma.userBankDetail.createMany({
        data: data.bankDetails.map((bd: any) => ({
          userId: user.id,
          bankId: bd.bankId,
          loanType: bd.loanType,
          payoutRatio: bd.payoutRatio,
        })),
      });

      // Fetch user with bank details to return complete data
      const userWithBankDetails = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          role: true,
          isActive: true,
          createdAt: true,
          userBankDetails: {
            include: {
              bank: true,
            },
          },
        },
      });

      return userWithBankDetails;
    }

    return user;
  }

  async updateUser(id: string, data: any, userRole?: string, organizationId?: string | null) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    // Multi-tenant check: ensure user belongs to the same organization
    if (userRole !== 'master_admin' && organizationId && user.organizationId !== organizationId) {
      throw new Error('Forbidden - User not found in your organization');
    }

    // Role-based validation: Admins cannot update users to admin/superadmin/master_admin roles
    if (userRole === 'admin' && data.role) {
      if (data.role !== 'connector' && data.role !== 'backoffice') {
        throw new Error('Forbidden - Admins can only set user roles to Connector or BackOffice');
      }
    }

    // Check email uniqueness if updating
    if (data.email && data.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Check mobile uniqueness if updating
    if (data.mobile && data.mobile !== user.mobile) {
      const existingMobile = await prisma.user.findUnique({
        where: { mobile: data.mobile },
      });
      if (existingMobile) {
        throw new Error('Mobile number already exists');
      }
    }

    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.email) updateData.email = data.email;
    if (data.mobile) updateData.mobile = data.mobile;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userBankDetails: {
          include: {
            bank: true,
          },
        },
      },
    });

    // Update bank details if provided
    if (data.bankDetails) {
      await prisma.userBankDetail.deleteMany({ where: { userId: id } });
      if (data.bankDetails.length > 0) {
        await prisma.userBankDetail.createMany({
          data: data.bankDetails.map((bd: any) => ({
            userId: id,
            bankId: bd.bankId,
            loanType: bd.loanType,
            payoutRatio: bd.payoutRatio,
          })),
        });
      }

      // Fetch updated user with bank details
      const userWithBankDetails = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userBankDetails: {
            include: {
              bank: true,
            },
          },
        },
      });

      return userWithBankDetails;
    }

    return updatedUser;
  }

  async deleteUser(id: string, userRole?: string, organizationId?: string | null) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    // Multi-tenant check: ensure user belongs to the same organization
    if (userRole !== 'master_admin' && organizationId && user.organizationId !== organizationId) {
      throw new Error('Forbidden - User not found in your organization');
    }

    await prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }

  async getConnectors(userId?: string, userRole?: string, organizationId?: string | null) {
    const where: any = { role: 'connector', isActive: true };

    // Multi-tenant filtering: filter by organizationId (except for master_admin)
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    // Admin sees only their created connectors
    // Only apply filter if userId is defined to prevent Prisma from filtering for NULL createdBy
    if (userRole === 'admin' && userId) {
      where.createdBy = userId;
    }

    const connectors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        createdBy: true,
        userBankDetails: {
          select: {
            bankId: true,
            loanType: true,
            payoutRatio: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return connectors;
  }

  async getAdmins(userRole?: string, organizationId?: string | null) {
    const where: any = { role: 'admin', isActive: true };

    // Multi-tenant filtering: filter by organizationId (except for master_admin)
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    const admins = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return admins;
  }

  async updateProfile(userId: string, data: any, photoPath?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    // Check email uniqueness if updating
    if (data.email && data.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Check mobile uniqueness if updating
    if (data.mobile && data.mobile !== user.mobile) {
      const existingMobile = await prisma.user.findUnique({
        where: { mobile: data.mobile },
      });
      if (existingMobile) {
        throw new Error('Mobile number already exists');
      }
    }

    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.email) updateData.email = data.email;
    if (data.mobile) updateData.mobile = data.mobile;
    if (photoPath) updateData.profilePhoto = photoPath;

    // Company details (for admin and superadmin)
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.companyEmail !== undefined) updateData.companyEmail = data.companyEmail;
    if (data.companyAddress !== undefined) updateData.companyAddress = data.companyAddress;
    if (data.companyGSTIN !== undefined) updateData.companyGSTIN = data.companyGSTIN;
    if (data.companyState !== undefined) updateData.companyState = data.companyState;
    if (data.companyStateCode !== undefined) updateData.companyStateCode = data.companyStateCode;
    if (data.hsnSac !== undefined) updateData.hsnSac = data.hsnSac;
    if (data.cgstRate !== undefined) updateData.cgstRate = data.cgstRate;
    if (data.sgstRate !== undefined) updateData.sgstRate = data.sgstRate;

    // Update password if provided
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        profilePhoto: true,
        companyName: true,
        companyEmail: true,
        companyAddress: true,
        companyGSTIN: true,
        companyState: true,
        companyStateCode: true,
        hsnSac: true,
        cgstRate: true,
        sgstRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteProfilePhoto(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
    });

    return { message: 'Profile photo deleted successfully' };
  }

  // Get user counts by role for an organization
  async getUserLimitsStatus(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { pricingTier: true, name: true },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const pricingTier = organization.pricingTier as keyof typeof PRICING_TIER_LIMITS;
    const tierLimits = PRICING_TIER_LIMITS[pricingTier];

    if (!tierLimits || !tierLimits.userLimits) {
      return null;
    }

    // Count users by role
    const [superadminCount, adminCount, backofficeCount, connectorCount] = await Promise.all([
      prisma.user.count({ where: { organizationId, role: 'superadmin', isActive: true } }),
      prisma.user.count({ where: { organizationId, role: 'admin', isActive: true } }),
      prisma.user.count({ where: { organizationId, role: 'backoffice', isActive: true } }),
      prisma.user.count({ where: { organizationId, role: 'connector', isActive: true } }),
    ]);

    return {
      pricingTier,
      organizationName: organization.name,
      limits: {
        superadmin: { current: superadminCount, max: tierLimits.userLimits.superadmin },
        admin: { current: adminCount, max: tierLimits.userLimits.admin },
        backoffice: { current: backofficeCount, max: tierLimits.userLimits.backoffice },
        connector: { current: connectorCount, max: tierLimits.userLimits.connector },
      },
      isCustomizable: pricingTier === 'enterprise' && (tierLimits as any).isCustomizable,
      addonPricing: pricingTier === 'enterprise' ? (tierLimits as any).addonPricing : null,
    };
  }
}
