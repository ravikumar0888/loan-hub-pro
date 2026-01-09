import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { OrganizationQueryParams, CreateOrganizationDto, UpdateOrganizationDto } from '../types';
import { hashPassword } from '../utils/password';

export class OrganizationsService {
  /**
   * Get all organizations (master_admin only)
   * Supports filtering by status and search
   */
  async getOrganizations(query: OrganizationQueryParams, userRole?: string) {
    // Only master_admin can view all organizations
    if (userRole !== 'master_admin') {
      throw new Error('Unauthorized: Only master admins can view all organizations');
    }

    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              customers: true,
              banks: true,
              dsas: true,
              invoices: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count({ where }),
    ]);

    return {
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get organization by ID
   * master_admin: any org
   * superadmin/admin: only their org
   */
  async getOrganizationById(id: string, userRole?: string, organizationId?: string | null) {
    // Authorization check
    if (userRole !== 'master_admin' && organizationId !== id) {
      throw new Error('Forbidden: Cannot access other organizations');
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            banks: true,
            dsas: true,
            invoices: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  }

  /**
   * Create organization with super admin (self-service signup)
   */
  async createOrganization(data: CreateOrganizationDto) {
    // Validate pricing tier and seats
    const tierLimits: Record<string, { min: number; max: number | null }> = {
      starter: { min: 1, max: 5 },
      professional: { min: 5, max: 25 },
      enterprise: { min: 10, max: null },
    };

    const limits = tierLimits[data.pricingTier];
    if (!limits) {
      throw new Error('Invalid pricing tier');
    }

    if (data.seats < limits.min || (limits.max && data.seats > limits.max)) {
      throw new Error(`Seats must be between ${limits.min} and ${limits.max || 'unlimited'} for ${data.pricingTier} plan`);
    }

    // Check if email already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { email: data.email },
    });

    if (existingOrg) {
      throw new Error('Organization email already exists');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });

    if (existingUser) {
      throw new Error('Admin email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.adminPassword);

    // Create organization and super admin in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create super admin user first (without organizationId)
      const superAdmin = await tx.user.create({
        data: {
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          email: data.adminEmail,
          mobile: data.adminMobile,
          passwordHash,
          role: 'superadmin',
          isActive: true,
        },
      });

      // Create organization with trial status (14 days)
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
          logo: data.logo,
          pricingTier: data.pricingTier as any,
          seats: data.seats,
          usedSeats: 1, // Super admin counts as first user
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });

      // Update user with organizationId
      await tx.user.update({
        where: { id: superAdmin.id },
        data: { organizationId: organization.id },
      });

      return {
        ...organization,
        superAdmin: {
          id: superAdmin.id,
          firstName: superAdmin.firstName,
          lastName: superAdmin.lastName,
          email: superAdmin.email,
        },
      };
    });

    return result;
  }

  /**
   * Update organization (superadmin/admin or master_admin)
   */
  async updateOrganization(
    id: string,
    updates: UpdateOrganizationDto,
    userRole?: string,
    organizationId?: string | null
  ) {
    // Authorization check
    if (userRole !== 'master_admin' && organizationId !== id) {
      throw new Error('Forbidden: Cannot update other organizations');
    }

    // Only master_admin can change status
    if (updates.status && userRole !== 'master_admin') {
      delete updates.status;
    }

    // Validate seat limits if changing pricing tier or seats
    if (updates.pricingTier || updates.seats) {
      const currentOrg = await prisma.organization.findUnique({ where: { id } });
      if (!currentOrg) {
        throw new Error('Organization not found');
      }

      const tier = updates.pricingTier || currentOrg.pricingTier;
      const seats = updates.seats || currentOrg.seats;

      const tierLimits: Record<string, { min: number; max: number | null }> = {
        starter: { min: 1, max: 5 },
        professional: { min: 5, max: 25 },
        enterprise: { min: 10, max: null },
      };

      const limits = tierLimits[tier];
      if (seats < limits.min || (limits.max && seats > limits.max)) {
        throw new Error(`Seats must be between ${limits.min} and ${limits.max || 'unlimited'} for ${tier} plan`);
      }

      // Check if current usedSeats exceeds new seats limit
      if (seats < currentOrg.usedSeats) {
        throw new Error(`Cannot reduce seats below current usage (${currentOrg.usedSeats} users active)`);
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: updates as any,
    });

    return organization;
  }

  /**
   * Delete organization (master_admin only)
   * Cascades to users, customers, banks, dsas, invoices
   */
  async deleteOrganization(id: string, userRole?: string) {
    if (userRole !== 'master_admin') {
      throw new Error('Unauthorized: Only master admins can delete organizations');
    }

    await prisma.organization.delete({
      where: { id },
    });

    return { message: 'Organization deleted successfully' };
  }

  /**
   * Get organization statistics (for dashboard)
   */
  async getOrganizationStats(id: string, userRole?: string, organizationId?: string | null) {
    // Authorization check
    if (userRole !== 'master_admin' && organizationId !== id) {
      throw new Error('Forbidden: Cannot access other organizations');
    }

    const [users, customers, banks, dsas, activeInvoices] = await Promise.all([
      prisma.user.count({ where: { organizationId: id, isActive: true } }),
      prisma.customer.count({ where: { organizationId: id } }),
      prisma.bank.count({ where: { organizationId: id } }),
      prisma.dsa.count({ where: { organizationId: id } }),
      prisma.invoice.count({
        where: {
          organizationId: id,
          status: { in: ['pending', 'overdue'] },
        },
      }),
    ]);

    return {
      users,
      customers,
      banks,
      dsas,
      activeInvoices,
    };
  }
}
