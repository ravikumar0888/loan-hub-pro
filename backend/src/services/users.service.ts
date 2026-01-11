import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { PaginationQuery, UserRole } from '../types';

export class UsersService {
  async getUsers(query: PaginationQuery & { role?: UserRole; search?: string }, userRole?: string, organizationId?: string | null) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Multi-tenant filtering: filter by organizationId (except for master_admin)
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { mobile: { contains: query.search } },
      ];
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
          userBankDetails: {
            include: {
              bank: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

  async createUser(data: any, organizationId?: string | null) {
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

  async getConnectors(userRole?: string, organizationId?: string | null) {
    const where: any = { role: 'connector', isActive: true };

    // Multi-tenant filtering: filter by organizationId (except for master_admin)
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    const connectors = await prisma.user.findMany({
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

    return connectors;
  }
}
