import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { PaginationQuery } from '../types';

export class DsasService {
  async getDsas(query: PaginationQuery & { search?: string }) {
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

    const [dsas, total] = await Promise.all([
      prisma.dsa.findMany({
        where,
        include: {
          bankDetails: {
            include: {
              bank: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.dsa.count({ where }),
    ]);

    return {
      data: dsas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDsaById(id: string) {
    const dsa = await prisma.dsa.findUnique({
      where: { id },
      include: {
        bankDetails: {
          include: {
            bank: true,
          },
        },
      },
    });

    if (!dsa) {
      throw new Error('DSA not found');
    }

    return dsa;
  }

  async createDsa(data: { name: string; bankDetails: any[] }) {
    // Check if DSA already exists
    const existing = await prisma.dsa.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('DSA already exists');
    }

    const dsa = await prisma.dsa.create({
      data: {
        name: data.name,
        bankDetails: {
          create: data.bankDetails.map((bd) => ({
            bankId: bd.bankId,
            loanType: bd.loanType,
            payoutRatio: bd.payoutRatio,
          })),
        },
      },
      include: {
        bankDetails: {
          include: {
            bank: true,
          },
        },
      },
    });

    return dsa;
  }

  async updateDsa(id: string, data: { name?: string; isActive?: boolean; bankDetails?: any[] }) {
    const dsa = await prisma.dsa.findUnique({ where: { id } });

    if (!dsa) {
      throw new Error('DSA not found');
    }

    // Check name uniqueness if updating
    if (data.name && data.name !== dsa.name) {
      const existing = await prisma.dsa.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw new Error('DSA name already exists');
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update bank details if provided
    if (data.bankDetails) {
      await prisma.dsaBankDetail.deleteMany({ where: { dsaId: id } });

      if (data.bankDetails.length > 0) {
        updateData.bankDetails = {
          create: data.bankDetails.map((bd) => ({
            bankId: bd.bankId,
            loanType: bd.loanType,
            payoutRatio: bd.payoutRatio,
          })),
        };
      }
    }

    const updatedDsa = await prisma.dsa.update({
      where: { id },
      data: updateData,
      include: {
        bankDetails: {
          include: {
            bank: true,
          },
        },
      },
    });

    return updatedDsa;
  }

  async deleteDsa(id: string) {
    const dsa = await prisma.dsa.findUnique({ where: { id } });

    if (!dsa) {
      throw new Error('DSA not found');
    }

    await prisma.dsa.delete({ where: { id } });

    return { message: 'DSA deleted successfully' };
  }

  async getAllDsas() {
    const dsas = await prisma.dsa.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return dsas;
  }
}
