import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { PaginationQuery } from '../types';

export class BanksService {
  async getBanks(query: PaginationQuery & { search?: string }, userRole?: string, organizationId?: string | null) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Multi-tenant filtering
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [banks, total] = await Promise.all([
      prisma.bank.findMany({
        where,
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' }
        ],
      }),
      prisma.bank.count({ where }),
    ]);

    return {
      data: banks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBankById(id: string, userRole?: string, organizationId?: string | null) {
    const where: any = { id };

    // Multi-tenant filtering - only allow access to banks in user's organization
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    const bank = await prisma.bank.findFirst({
      where,
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
      },
    });

    if (!bank) {
      throw new Error('Bank not found');
    }

    return bank;
  }

  async createBank(data: { name: string; organizationId?: string | null }) {
    // Check if bank already exists in this organization
    const existing = await prisma.bank.findFirst({
      where: {
        name: data.name,
        organizationId: data.organizationId
      },
    });

    if (existing) {
      throw new Error('Bank already exists in your organization');
    }

    const bank = await prisma.bank.create({
      data: {
        name: data.name,
        organizationId: data.organizationId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        organizationId: true,
      },
    });

    return bank;
  }

  async updateBank(id: string, data: { name?: string; isActive?: boolean }, userRole?: string, organizationId?: string | null) {
    const where: any = { id };

    // Multi-tenant filtering - only allow updating banks in user's organization
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    const bank = await prisma.bank.findFirst({ where });

    if (!bank) {
      throw new Error('Bank not found');
    }

    // Check name uniqueness within organization if updating
    if (data.name && data.name !== bank.name) {
      const existing = await prisma.bank.findFirst({
        where: {
          name: data.name,
          organizationId: bank.organizationId
        },
      });
      if (existing) {
        throw new Error('Bank name already exists in your organization');
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedBank = await prisma.bank.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
      },
    });

    return updatedBank;
  }

  async deleteBank(id: string, userRole?: string, organizationId?: string | null) {
    const where: any = { id };

    // Multi-tenant filtering - only allow deleting banks in user's organization
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    const bank = await prisma.bank.findFirst({ where });

    if (!bank) {
      throw new Error('Bank not found');
    }

    await prisma.bank.delete({ where: { id } });

    return { message: 'Bank deleted successfully' };
  }

  async getAllBanks(userRole?: string, organizationId?: string | null) {
    const where: any = { isActive: true };

    // Multi-tenant filtering
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    const banks = await prisma.bank.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return banks;
  }
}
