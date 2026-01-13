import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { PaginationQuery } from '../types';

export class DsasService {
  async getDsas(query: PaginationQuery & { search?: string }, userRole?: string, organizationId?: string | null) {
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

    // Convert Decimal fields to numbers
    const transformedDsas = dsas.map((dsa) => ({
      ...dsa,
      bankDetails: dsa.bankDetails.map((bd) => ({
        ...bd,
        payoutRatio: Number(bd.payoutRatio),
      })),
    }));

    return {
      data: transformedDsas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDsaById(id: string, userRole?: string, organizationId?: string | null) {
    const where: any = { id };

    // Multi-tenant filtering - only allow access to DSAs in user's organization
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    const dsa = await prisma.dsa.findFirst({
      where,
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

    // Convert Decimal fields to numbers
    const transformedDsa = {
      ...dsa,
      bankDetails: dsa.bankDetails.map((bd) => ({
        ...bd,
        payoutRatio: Number(bd.payoutRatio),
      })),
    };

    return transformedDsa;
  }

  async createDsa(data: { name: string; bankDetails: any[]; organizationId?: string | null }) {
    // Check if DSA already exists in this organization
    const existing = await prisma.dsa.findFirst({
      where: {
        name: data.name,
        organizationId: data.organizationId
      },
    });

    if (existing) {
      throw new Error('DSA already exists in your organization');
    }

    const dsa = await prisma.dsa.create({
      data: {
        name: data.name,
        organizationId: data.organizationId,
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

    // Convert Decimal fields to numbers
    const transformedDsa = {
      ...dsa,
      bankDetails: dsa.bankDetails.map((bd) => ({
        ...bd,
        payoutRatio: Number(bd.payoutRatio),
      })),
    };

    return transformedDsa;
  }

  async updateDsa(id: string, data: { name?: string; isActive?: boolean; bankDetails?: any[] }, userRole?: string, organizationId?: string | null) {
    const dsa = await prisma.dsa.findUnique({ where: { id } });

    if (!dsa) {
      throw new Error('DSA not found');
    }

    // Multi-tenant check: ensure DSA belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && dsa.organizationId !== organizationId) {
      throw new Error('Forbidden - DSA not found in your organization');
    }

    // Check name uniqueness within organization if updating
    if (data.name && data.name !== dsa.name) {
      const existing = await prisma.dsa.findFirst({
        where: {
          name: data.name,
          organizationId: dsa.organizationId
        },
      });
      if (existing) {
        throw new Error('DSA name already exists in your organization');
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

    // Convert Decimal fields to numbers
    const transformedDsa = {
      ...updatedDsa,
      bankDetails: updatedDsa.bankDetails.map((bd) => ({
        ...bd,
        payoutRatio: Number(bd.payoutRatio),
      })),
    };

    return transformedDsa;
  }

  async deleteDsa(id: string, userRole?: string, organizationId?: string | null) {
    const dsa = await prisma.dsa.findUnique({ where: { id } });

    if (!dsa) {
      throw new Error('DSA not found');
    }

    // Multi-tenant check: ensure DSA belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && dsa.organizationId !== organizationId) {
      throw new Error('Forbidden - DSA not found in your organization');
    }

    await prisma.dsa.delete({ where: { id } });

    return { message: 'DSA deleted successfully' };
  }

  async getAllDsas(userRole?: string, organizationId?: string | null) {
    const where: any = { isActive: true };

    // Multi-tenant filtering
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    const dsas = await prisma.dsa.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return dsas;
  }
}
