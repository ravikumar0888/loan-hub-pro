import prisma from '../config/database';
import { PAGINATION_DEFAULTS } from '../config/constants';
import { CustomerFilterQuery } from '../types';
import { PayoutsService } from './payouts.service';
import { PDFService } from './pdf.service';
import { NotificationsService } from './notifications.service';

export class CustomersService {
  private payoutsService: PayoutsService;
  private notificationsService: NotificationsService;

  constructor() {
    this.payoutsService = new PayoutsService();
    this.notificationsService = new NotificationsService();
  }
  // Transform database customer format to frontend format
  private transformCustomer(customer: any) {
    return {
      ...customer,
      // Map database snake_case to camelCase
      dateOfBirth: customer.date_of_birth,
      currentCompany: customer.currentCompany,
      currentCompanyExperience: customer.current_company_exp,
      // Transform flat reference fields to nested objects
      reference1: customer.reference1Name || customer.reference1Mobile || customer.reference1Address
        ? {
            name: customer.reference1Name || '',
            mobile: customer.reference1Mobile || '',
            address: customer.reference1Address || '',
          }
        : undefined,
      reference2: customer.reference2Name || customer.reference2Mobile || customer.reference2Address
        ? {
            name: customer.reference2Name || '',
            mobile: customer.reference2Mobile || '',
            address: customer.reference2Address || '',
          }
        : undefined,
      // Remove duplicate database fields
      date_of_birth: undefined,
      current_company_exp: undefined,
      reference1Name: undefined,
      reference1Mobile: undefined,
      reference1Address: undefined,
      reference2Name: undefined,
      reference2Mobile: undefined,
      reference2Address: undefined,
    };
  }

  async getCustomers(query: CustomerFilterQuery, userId?: string, userRole?: string, organizationId?: string | null) {
    const page = query.page || PAGINATION_DEFAULTS.page;
    const limit = Math.min(query.limit || PAGINATION_DEFAULTS.limit, PAGINATION_DEFAULTS.maxLimit);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Debug logging
    console.log('[DEBUG] getCustomers called with:', { userId, userRole, organizationId });

    // Multi-tenant filtering: filter by organizationId (except for master_admin)
    if (userRole !== 'master_admin' && organizationId) {
      where.organizationId = organizationId;
    }

    // Role-based filtering
    if (userRole === 'connector') {
      // Connectors can only see their own customers
      where.connectorId = userId;
    } else if (userRole === 'backoffice') {
      // Backoffice can only see customers they created themselves
      where.createdBy = userId;
    } else if (userRole === 'admin') {
      // Admins can ONLY see customers where they are the lead owner
      where.leadOwner = userId;
    }
    // Note: Superadmin can see ALL customers in their organization (filtered only by organizationId above)

    if (query.status) {
      where.status = query.status;
    }

    // ConnectorId filter - only apply for non-admin/non-backoffice roles or if explicitly filtering
    if (query.connectorId && userRole !== 'admin' && userRole !== 'backoffice' && userRole !== 'superadmin') {
      where.connectorId = query.connectorId;
    }

    // Search filter - use AND to avoid overwriting existing OR conditions
    if (query.search) {
      const searchConditions = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { mobile: { contains: query.search } },
      ];

      // If there's already an OR clause (from admin filtering), combine with AND
      if (where.OR) {
        where.AND = [
          { OR: where.OR },  // Preserve existing OR conditions
          { OR: searchConditions }  // Add search OR conditions
        ];
        delete where.OR;  // Remove the top-level OR since we're using AND now
      } else {
        // No existing OR clause, just add search conditions
        where.OR = searchConditions;
      }
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

    // Debug logging - show final where clause
    console.log('[DEBUG] Final where clause:', JSON.stringify(where, null, 2));

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          applicationId: true,
          applicationDate: true,
          name: true,
          mobile: true,
          email: true,
          personalEmail: true,
          officialEmail: true,
          loanType: true,
          loanAmount: true,
          subventionAmount: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          motherName: true,
          spouseName: true,
          panNo: true,
          date_of_birth: true,
          currentCompany: true,
          current_company_exp: true,
          totalWorkExperience: true,
          qualification: true,
          maritalStatus: true,
          tenure: true,
          companyAddress: true,
          currentAddress: true,
          postalAddress: true,
          homeType: true,
          reference1Name: true,
          reference1Mobile: true,
          reference1Address: true,
          reference2Name: true,
          reference2Mobile: true,
          reference2Address: true,
          nomineeName: true,
          nomineeRelation: true,
          nomineeDateOfBirth: true,
          connectorId: true,
          dsaId: true,
          bankId: true,
          leadOwner: true,
          salesManager: true,
          caseType: true,
          location: true,
          organizationId: true,
          createdBy: true,
          connector: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              userBankDetails: {
                select: {
                  payoutRatio: true,
                  loanType: true,
                  bankId: true,
                },
              },
            },
          },
          dsa: {
            select: {
              id: true,
              name: true,
              bankDetails: {
                select: {
                  payoutRatio: true,
                  loanType: true,
                  bankId: true,
                },
              },
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
            take: 5,
          },
        },
        skip,
        take: limit,
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' }
        ],
      }),
      prisma.customer.count({ where }),
    ]);

    // Calculate payout and transform for each customer
    const customersWithPayout = customers.map((customer: any) => {
      let payout = 0;

      // Only calculate payout if customer status is 'disbursed'
      if (customer.status === 'disbursed') {
        // Find matching payout ratio from Connector's user bank details
        if (customer.connector?.userBankDetails && customer.connector.userBankDetails.length > 0 && customer.bankId && customer.loanType) {
          // Filter bank details to match customer's bank and loan type
          const matchingDetail = customer.connector.userBankDetails.find(
            (bd: any) => bd.bankId === customer.bankId && bd.loanType === customer.loanType
          );

          if (matchingDetail) {
            const payoutRatio = matchingDetail.payoutRatio.toNumber();
            const loanAmount = customer.loanAmount.toNumber();
            const subvention = customer.subventionAmount?.toNumber() || 0;

            // Calculate: (loanAmount × payoutRatio%) - subventionAmount
            payout = (loanAmount * payoutRatio / 100) - subvention;
          }
        }
      }

      // Transform customer data format and add payout
      return this.transformCustomer({
        ...customer,
        payout: payout,
      });
    });

    // Debug logging - show results
    console.log('[DEBUG] Query returned:', { total, returned: customers.length });
    console.log('[DEBUG] Customer IDs and createdBy:', customers.map(c => ({ id: c.id, createdBy: c.createdBy, orgId: c.organizationId })));

    return {
      data: customersWithPayout,
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

    // Role-based access control
    if (userRole === 'connector' && customer.connectorId !== userId) {
      // Connectors can only view their own customers
      throw new Error('Forbidden - You can only view your own customers');
    } else if (userRole === 'backoffice' && customer.createdBy !== userId) {
      // Backoffice can only view customers they created themselves
      throw new Error('Forbidden - You can only view customers you created');
    } else if (userRole === 'admin' && customer.leadOwner !== userId) {
      // Admins can ONLY view customers where they are the lead owner
      throw new Error('Forbidden - You can only view customers where you are the lead owner');
    }
    // Note: Superadmin can view ALL customers in their organization (already verified by organization check above)

    return this.transformCustomer(customer);
  }

  async createCustomer(data: any, userId?: string, userRole?: string, organizationId?: string | null) {
    // Validate organizationId for non-master_admin users
    if (userRole !== 'master_admin' && !organizationId) {
      throw new Error('Organization ID is required');
    }

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
        date_of_birth: parseDate(data.dateOfBirth || data.dob), // Frontend sends dateOfBirth
        currentCompany: data.currentCompany,
        current_company_exp: data.currentCompanyExp,
        totalWorkExperience: data.totalWorkExperience,
        qualification: data.qualification,
        maritalStatus: data.maritalStatus,
        tenure: data.tenure,
        companyAddress: data.companyAddress,
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

    // Auto-generate payout entry if created with 'disbursed' status
    if (customer.status === 'disbursed') {
      try {
        await this.payoutsService.generatePayoutForDisbursedCustomer(customer.id);
        console.log(`[INFO] Auto-generated payout entry for newly created customer ${customer.id}`);
      } catch (error) {
        console.error(`[ERROR] Failed to auto-generate payout for customer ${customer.id}:`, error);
        // Don't fail the create if payout generation fails
      }
    }

    // Send notification for new lead (backoffice or anyone creating a lead)
    if (organizationId && customer.createdBy) {
      try {
        // Get creator name
        const creator = await prisma.user.findUnique({
          where: { id: customer.createdBy },
          select: { firstName: true, lastName: true },
        });
        const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Someone';

        await this.notificationsService.notifyNewLead(
          customer.name,
          creatorName,
          organizationId,
          customer.id,
          customer.connectorId || undefined
        );
        console.log(`[INFO] Sent new lead notification for customer ${customer.id}`);
      } catch (error) {
        console.error(`[ERROR] Failed to send new lead notification for customer ${customer.id}:`, error);
        // Don't fail the create if notification fails
      }
    }

    // Generate PDF for the new customer
    try {
      const pdfUrl = await PDFService.generateCustomerPDF(customer.id);
      console.log(`[INFO] Generated PDF for customer ${customer.id}: ${pdfUrl}`);

      // Refresh customer data to include the pdfUrl
      customer = await prisma.customer.findUnique({
        where: { id: customer.id },
        include: {
          connector: {
            include: {
              userBankDetails: {
                include: {
                  bank: true,
                },
              },
            },
          },
          bank: true,
          dsa: true,
          leadOwnerUser: true,
          creator: true,
        },
      }) as any;
    } catch (pdfError) {
      console.error(`[ERROR] Failed to generate PDF for customer ${customer.id}:`, pdfError);
      // Don't fail the whole operation if PDF generation fails
    }

    return this.transformCustomer(customer);
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

    // Role-based access control
    if (userRole === 'connector') {
      // Connectors cannot update customers (read-only access)
      throw new Error('Forbidden - Connectors have read-only access');
    } else if (userRole === 'backoffice' && customer.createdBy !== userId) {
      // Backoffice can only update customers they created themselves
      throw new Error('Forbidden - You can only update customers you created');
    } else if (userRole === 'admin' && customer.leadOwner !== userId) {
      // Admins can ONLY update customers where they are the lead owner
      throw new Error('Forbidden - You can only update customers where you are the lead owner');
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
    if (data.dateOfBirth !== undefined) updateData.date_of_birth = parseDate(data.dateOfBirth || data.dob);
    if (data.currentCompany !== undefined) updateData.currentCompany = data.currentCompany;
    if (data.currentCompanyExp !== undefined) updateData.current_company_exp = data.currentCompanyExp;
    if (data.totalWorkExperience !== undefined) updateData.totalWorkExperience = data.totalWorkExperience;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.maritalStatus !== undefined) updateData.maritalStatus = data.maritalStatus;
    if (data.tenure !== undefined) updateData.tenure = data.tenure;
    if (data.companyAddress !== undefined) updateData.companyAddress = data.companyAddress;
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

    // Handle remarks - create new remark if provided
    if (data.remarks && data.remarks.trim()) {
      await prisma.customerRemark.create({
        data: {
          customerId: id,
          remark: data.remarks.trim(),
          created_by: userId,
        },
      });

      // Send notification for remark added
      // Notifies: Channel Partner (connector), Lead Owner, and Superadmins
      if (organizationId && userId) {
        try {
          const updater = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true },
          });
          const updaterName = updater ? `${updater.firstName} ${updater.lastName}` : 'Someone';

          await this.notificationsService.notifyRemarkAdded(
            customer.name,
            updaterName,
            data.remarks.trim(),
            organizationId,
            id,
            customer.connectorId || undefined,
            customer.leadOwner || undefined, // Lead Owner (admin)
            userId // Exclude the user who added the remark
          );
          console.log(`[INFO] Sent remark notification for customer ${id}`);
        } catch (error) {
          console.error(`[ERROR] Failed to send remark notification for customer ${id}:`, error);
          // Don't fail the update if notification fails
        }
      }
    }

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

    // Regenerate payout if subvention changed on disbursed customer
    if (customer.status === 'disbursed' && data.subventionAmount !== undefined && data.subventionAmount !== customer.subventionAmount) {
      try {
        await this.payoutsService.generatePayoutForDisbursedCustomer(id);
        console.log(`[INFO] Regenerated payout entry for customer ${id} due to subvention change`);
      } catch (error) {
        console.error(`[ERROR] Failed to regenerate payout for customer ${id}:`, error);
        // Don't fail the update if payout generation fails
      }
    }

    // Generate payout for new disbursements
    if (data.status === 'disbursed' && customer.status !== 'disbursed') {
      try {
        await this.payoutsService.generatePayoutForDisbursedCustomer(id);
        console.log(`[INFO] Auto-generated payout entry for newly disbursed customer ${id}`);
      } catch (error) {
        console.error(`[ERROR] Failed to auto-generate payout for customer ${id}:`, error);
        // Don't fail the update if payout generation fails
      }
    }

    // Remove payout entry when status changes FROM 'disbursed' to any other status
    if (customer.status === 'disbursed' && data.status && data.status !== 'disbursed') {
      try {
        // Delete the payout ledger entry for this customer
        await prisma.payoutLedger.deleteMany({
          where: {
            customerId: id,
            entry_type: 'credit',
          },
        });
        console.log(`[INFO] Removed payout entry for customer ${id} due to status change from disbursed to ${data.status}`);
      } catch (error) {
        console.error(`[ERROR] Failed to remove payout entry for customer ${id}:`, error);
        // Don't fail the update if payout removal fails
      }
    }

    // Regenerate PDF if customer details changed
    try {
      const pdfUrl = await PDFService.regenerateCustomerPDF(id);
      console.log(`[INFO] Regenerated PDF for customer ${id}: ${pdfUrl}`);

      // Refresh customer data to include the updated pdfUrl
      updatedCustomer = await prisma.customer.findUnique({
        where: { id },
        include: {
          connector: {
            include: {
              userBankDetails: {
                include: {
                  bank: true,
                },
              },
            },
          },
          bank: true,
          dsa: true,
          leadOwnerUser: true,
          creator: true,
        },
      }) as any;
    } catch (pdfError) {
      console.error(`[ERROR] Failed to regenerate PDF for customer ${id}:`, pdfError);
      // Don't fail the update if PDF generation fails
    }

    return this.transformCustomer(updatedCustomer);
  }

  async deleteCustomer(id: string, userId?: string, userRole?: string, organizationId?: string | null) {
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Multi-tenant check: ensure customer belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && customer.organizationId !== organizationId) {
      throw new Error('Forbidden - Customer not found in your organization');
    }

    // Role-based access control - only superadmin and admin can delete
    if (userRole === 'connector' || userRole === 'backoffice') {
      throw new Error('Forbidden - You do not have permission to delete customers');
    } else if (userRole === 'admin' && customer.leadOwner !== userId) {
      throw new Error('Forbidden - You can only delete customers where you are the lead owner');
    }

    await prisma.customer.delete({ where: { id } });

    return { message: 'Customer deleted successfully' };
  }

  async addRemark(customerId: string, remark: string, createdBy: string, userId?: string, userRole?: string, organizationId?: string | null) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Multi-tenant check: ensure customer belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && customer.organizationId !== organizationId) {
      throw new Error('Forbidden - Customer not found in your organization');
    }

    // Role-based access control - users can only add remarks to customers they have access to
    if (userRole === 'connector' && customer.connectorId !== userId) {
      throw new Error('Forbidden - You can only add remarks to your own customers');
    } else if (userRole === 'backoffice' && customer.createdBy !== userId) {
      throw new Error('Forbidden - You can only add remarks to customers you created');
    } else if (userRole === 'admin' && customer.leadOwner !== userId) {
      throw new Error('Forbidden - You can only add remarks to customers where you are the lead owner');
    }

    const newRemark = await prisma.customerRemark.create({
      data: {
        customerId,
        remark,
        created_by: createdBy,
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

    // Send notification for remark added
    // Notifies: Channel Partner (connector), Lead Owner, and Superadmins
    if (organizationId && createdBy) {
      try {
        const creator = await prisma.user.findUnique({
          where: { id: createdBy },
          select: { firstName: true, lastName: true },
        });
        const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Someone';

        await this.notificationsService.notifyRemarkAdded(
          customer.name,
          creatorName,
          remark,
          organizationId,
          customerId,
          customer.connectorId || undefined,
          customer.leadOwner || undefined, // Lead Owner (admin)
          createdBy // Exclude the user who added the remark
        );
        console.log(`[INFO] Sent remark notification for customer ${customerId}`);
      } catch (error) {
        console.error(`[ERROR] Failed to send remark notification for customer ${customerId}:`, error);
        // Don't fail if notification fails
      }
    }

    return newRemark;
  }

  async getCustomerRemarks(customerId: string, userId?: string, userRole?: string, organizationId?: string | null) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Multi-tenant check: ensure customer belongs to user's organization
    if (userRole !== 'master_admin' && organizationId && customer.organizationId !== organizationId) {
      throw new Error('Forbidden - Customer not found in your organization');
    }

    // Role-based access control - users can only view remarks of customers they have access to
    if (userRole === 'connector' && customer.connectorId !== userId) {
      throw new Error('Forbidden - You can only view remarks of your own customers');
    } else if (userRole === 'backoffice' && customer.createdBy !== userId) {
      throw new Error('Forbidden - You can only view remarks of customers you created');
    } else if (userRole === 'admin' && customer.leadOwner !== userId) {
      throw new Error('Forbidden - You can only view remarks of customers where you are the lead owner');
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
