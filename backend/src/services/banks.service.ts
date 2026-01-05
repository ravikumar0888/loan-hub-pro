import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { PaginationQuery } from '../types';

export class BanksService {
  async getBanks(query: PaginationQuery & { search?: string }) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};

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
        orderBy: { name: 'asc' },
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

  async getBankById(id: string) {
    const bank = await prisma.bank.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!bank) {
      throw new Error('Bank not found');
    }

    return bank;
  }

  async createBank(data: { name: string }) {
    // Check if bank already exists
    const existing = await prisma.bank.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Bank already exists');
    }

    const bank = await prisma.bank.create({
      data: {
        name: data.name,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    return bank;
  }

  async updateBank(id: string, data: { name?: string; isActive?: boolean }) {
    const bank = await prisma.bank.findUnique({ where: { id } });

    if (!bank) {
      throw new Error('Bank not found');
    }

    // Check name uniqueness if updating
    if (data.name && data.name !== bank.name) {
      const existing = await prisma.bank.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw new Error('Bank name already exists');
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
      },
    });

    return updatedBank;
  }

  async deleteBank(id: string) {
    const bank = await prisma.bank.findUnique({ where: { id } });

    if (!bank) {
      throw new Error('Bank not found');
    }

    await prisma.bank.delete({ where: { id } });

    return { message: 'Bank deleted successfully' };
  }

  async getAllBanks() {
    const banks = await prisma.bank.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return banks;
  }
}
