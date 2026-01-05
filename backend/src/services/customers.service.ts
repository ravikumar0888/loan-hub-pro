import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { CustomerFilterQuery } from '../types';

export class CustomersService {
  async getCustomers(query: CustomerFilterQuery, userId?: string, userRole?: string) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based filtering: connectors can only see their own customers
    if (userRole === 'connector') {
      where.connectorId = userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.connectorId) {
      where.connectorId = query.connectorId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { mobile: { contains: query.search } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.applicationDate = {};
      if (query.startDate) {
        where.applicationDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.applicationDate.lte = new Date(query.endDate);
      }
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          connector: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          dsa: {
            select: {
              id: true,
              name: true,
            },
          },
          bank: {
            select: {
              id: true,
              name: true,
            },
          },
          remarks: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id: string, userId?: string, userRole?: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        connector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
          },
        },
        dsa: {
          select: {
            id: true,
            name: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
        remarks: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Connectors can only view their own customers
    if (userRole === 'connector' && customer.connectorId !== userId) {
      throw new Error('Forbidden - You can only view your own customers');
    }

    return customer;
  }

  async createCustomer(data: any) {
    const customer = await prisma.customer.create({
      data: {
        applicationId: data.applicationId,
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        motherName: data.motherName,
        spouseName: data.spouseName,
        personalEmail: data.personalEmail,
        officialEmail: data.officialEmail,
        totalWorkExperience: data.totalWorkExperience,
        currentCompanyExp: data.currentCompanyExp,
        currentAddress: data.currentAddress,
        postalAddress: data.postalAddress,
        homeType: data.homeType,
        reference1Name: data.reference1Name,
        reference1Mobile: data.reference1Mobile,
        reference1Address: data.reference1Address,
        reference2Name: data.reference2Name,
        reference2Mobile: data.reference2Mobile,
        reference2Address: data.reference2Address,
        loanType: data.loanType,
        loanAmount: data.loanAmount,
        connectorId: data.connectorId,
        dsaId: data.dsaId,
        bankId: data.bankId,
        leadOwner: data.leadOwner,
        salesManager: data.salesManager,
        status: data.status || 'login',
        remarks: data.remarks
          ? {
              create: {
                remark: data.remarks,
                createdBy: data.createdBy,
              },
            }
          : undefined,
      },
      include: {
        connector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        dsa: {
          select: {
            id: true,
            name: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
        remarks: true,
      },
    });

    return customer;
  }

  async updateCustomer(id: string, data: any, userId?: string, userRole?: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Connectors cannot update customers (read-only access)
    if (userRole === 'connector') {
      throw new Error('Forbidden - Connectors have read-only access');
    }

    const updateData: any = {};
    if (data.applicationId !== undefined) updateData.applicationId = data.applicationId;
    if (data.name) updateData.name = data.name;
    if (data.mobile) updateData.mobile = data.mobile;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.motherName !== undefined) updateData.motherName = data.motherName;
    if (data.spouseName !== undefined) updateData.spouseName = data.spouseName;
    if (data.personalEmail !== undefined) updateData.personalEmail = data.personalEmail;
    if (data.officialEmail !== undefined) updateData.officialEmail = data.officialEmail;
    if (data.totalWorkExperience !== undefined) updateData.totalWorkExperience = data.totalWorkExperience;
    if (data.currentCompanyExp !== undefined) updateData.currentCompanyExp = data.currentCompanyExp;
    if (data.currentAddress !== undefined) updateData.currentAddress = data.currentAddress;
    if (data.postalAddress !== undefined) updateData.postalAddress = data.postalAddress;
    if (data.homeType !== undefined) updateData.homeType = data.homeType;
    if (data.reference1Name !== undefined) updateData.reference1Name = data.reference1Name;
    if (data.reference1Mobile !== undefined) updateData.reference1Mobile = data.reference1Mobile;
    if (data.reference1Address !== undefined) updateData.reference1Address = data.reference1Address;
    if (data.reference2Name !== undefined) updateData.reference2Name = data.reference2Name;
    if (data.reference2Mobile !== undefined) updateData.reference2Mobile = data.reference2Mobile;
    if (data.reference2Address !== undefined) updateData.reference2Address = data.reference2Address;
    if (data.loanType) updateData.loanType = data.loanType;
    if (data.loanAmount) updateData.loanAmount = data.loanAmount;
    if (data.connectorId !== undefined) updateData.connectorId = data.connectorId;
    if (data.dsaId !== undefined) updateData.dsaId = data.dsaId;
    if (data.bankId !== undefined) updateData.bankId = data.bankId;
    if (data.leadOwner !== undefined) updateData.leadOwner = data.leadOwner;
    if (data.salesManager !== undefined) updateData.salesManager = data.salesManager;
    if (data.status) updateData.status = data.status;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        connector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        dsa: {
          select: {
            id: true,
            name: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
        remarks: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return updatedCustomer;
  }

  async deleteCustomer(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new Error('Customer not found');
    }

    await prisma.customer.delete({ where: { id } });

    return { message: 'Customer deleted successfully' };
  }

  async addRemark(customerId: string, remark: string, createdBy: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const newRemark = await prisma.customerRemark.create({
      data: {
        customerId,
        remark,
        createdBy,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return newRemark;
  }

  async getCustomerRemarks(customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const remarks = await prisma.customerRemark.findMany({
      where: { customerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return remarks;
  }
}
