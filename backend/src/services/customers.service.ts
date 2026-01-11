import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { CustomerFilterQuery } from '../types';

export class CustomersService {
  async getCustomers(query: CustomerFilterQuery, userId?: string, userRole?: string, organizationId?: string | null) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Multi-tenant filtering: filter by organizationId (except for master_admin)
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

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
              users: {
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

  async getCustomerById(id: string, userId?: string, userRole?: string, organizationId?: string | null) {
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
            users: {
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

    // Multi-tenant check: ensure customer belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && customer.organizationId !== organizationId) {
      throw new Error('Forbidden - Customer not found in your organization');
    }

    // Connectors can only view their own customers
    if (userRole === 'connector' && customer.connectorId !== userId) {
      throw new Error('Forbidden - You can only view your own customers');
    }

    return customer;
  }

  async createCustomer(data: any, organizationId?: string | null) {
    // Helper function to convert date strings to Date objects
    const parseDate = (dateStr: any): Date | undefined => {
      if (!dateStr) return undefined;
      if (dateStr instanceof Date) return dateStr;
      return new Date(dateStr);
    };

    const customer = await prisma.customer.create({
      data: {
        applicationId: data.applicationId,
        applicationDate: parseDate(data.applicationDate) || new Date(),
        name: data.name,
        mobile: data.mobile,
        personalEmail: data.personalEmail,
        officialEmail: data.officialEmail,
        motherName: data.motherName,
        spouseName: data.spouseName,
        panNo: data.panNo,
        aadharNo: data.aadharNo,
        dob: parseDate(data.dateOfBirth || data.dob), // Frontend sends dateOfBirth, backend uses dob
        currentCompany: data.currentCompany,
        currentCompanyExperience: data.currentCompanyExp,
        totalWorkExperience: data.totalWorkExperience,
        currentAddress: data.currentAddress,
        postalAddress: data.postalAddress,
        homeType: data.homeType,
        reference1Name: data.reference1Name,
        reference1Mobile: data.reference1Mobile,
        reference1Address: data.reference1Address,
        reference2Name: data.reference2Name,
        reference2Mobile: data.reference2Mobile,
        reference2Address: data.reference2Address,
        nomineeName: data.nomineeName,
        nomineeRelation: data.nomineeRelation,
        nomineeDateOfBirth: parseDate(data.nomineeDateOfBirth),
        loanType: data.loanType,
        loanAmount: data.loanAmount,
        caseType: data.caseType,
        location: data.location,
        subventionAmount: data.subventionAmount,
        connectorId: data.connectorId,
        dsaId: data.dsaId,
        bankId: data.bankId,
        leadOwner: data.leadOwner,
        salesManager: data.salesManager,
        status: data.status || 'login',
        organizationId: organizationId,
        createdBy: data.createdBy,
        remarks: data.remarks
          ? {
              create: {
                remark: data.remarks,
                created_by: data.createdBy,
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

  async updateCustomer(id: string, data: any, userId?: string, userRole?: string, organizationId?: string | null) {
    // Helper function to convert date strings to Date objects
    const parseDate = (dateStr: any): Date | undefined => {
      if (!dateStr) return undefined;
      if (dateStr instanceof Date) return dateStr;
      return new Date(dateStr);
    };

    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Multi-tenant check: ensure customer belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && customer.organizationId !== organizationId) {
      throw new Error('Forbidden - Customer not found in your organization');
    }

    // Connectors cannot update customers (read-only access)
    if (userRole === 'connector') {
      throw new Error('Forbidden - Connectors have read-only access');
    }

    const updateData: any = {};
    if (data.applicationId !== undefined) updateData.applicationId = data.applicationId;
    if (data.applicationDate !== undefined) updateData.applicationDate = parseDate(data.applicationDate);
    if (data.name) updateData.name = data.name;
    if (data.mobile) updateData.mobile = data.mobile;
    if (data.motherName !== undefined) updateData.motherName = data.motherName;
    if (data.spouseName !== undefined) updateData.spouseName = data.spouseName;
    if (data.personalEmail !== undefined) updateData.personalEmail = data.personalEmail;
    if (data.officialEmail !== undefined) updateData.officialEmail = data.officialEmail;
    if (data.panNo !== undefined) updateData.panNo = data.panNo;
    if (data.aadharNo !== undefined) updateData.aadharNo = data.aadharNo;
    if (data.dateOfBirth !== undefined) updateData.dob = parseDate(data.dateOfBirth || data.dob);
    if (data.currentCompany !== undefined) updateData.currentCompany = data.currentCompany;
    if (data.currentCompanyExp !== undefined) updateData.currentCompanyExperience = data.currentCompanyExp;
    if (data.totalWorkExperience !== undefined) updateData.totalWorkExperience = data.totalWorkExperience;
    if (data.currentAddress !== undefined) updateData.currentAddress = data.currentAddress;
    if (data.postalAddress !== undefined) updateData.postalAddress = data.postalAddress;
    if (data.homeType !== undefined) updateData.homeType = data.homeType;
    if (data.reference1Name !== undefined) updateData.reference1Name = data.reference1Name;
    if (data.reference1Mobile !== undefined) updateData.reference1Mobile = data.reference1Mobile;
    if (data.reference1Address !== undefined) updateData.reference1Address = data.reference1Address;
    if (data.reference2Name !== undefined) updateData.reference2Name = data.reference2Name;
    if (data.reference2Mobile !== undefined) updateData.reference2Mobile = data.reference2Mobile;
    if (data.reference2Address !== undefined) updateData.reference2Address = data.reference2Address;
    if (data.nomineeName !== undefined) updateData.nomineeName = data.nomineeName;
    if (data.nomineeRelation !== undefined) updateData.nomineeRelation = data.nomineeRelation;
    if (data.nomineeDateOfBirth !== undefined) updateData.nomineeDateOfBirth = parseDate(data.nomineeDateOfBirth);
    if (data.loanType) updateData.loanType = data.loanType;
    if (data.loanAmount) updateData.loanAmount = data.loanAmount;
    if (data.caseType !== undefined) updateData.caseType = data.caseType;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.subventionAmount !== undefined) updateData.subventionAmount = data.subventionAmount;
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
            users: {
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
        users: {
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
        users: {
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
