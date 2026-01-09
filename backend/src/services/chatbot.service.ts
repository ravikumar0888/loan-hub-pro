import OpenAI from 'openai';
import { CustomersService } from './customers.service';
import { DashboardService } from './dashboard.service';
import { PayoutsService } from './payouts.service';
import { SYSTEM_PROMPT, FUNCTION_DEFINITIONS, ERROR_MESSAGES } from '../utils/chatbotPrompts';

interface ChatbotQuery {
  query: string;
  userId: string;
  userRole: string;
}

interface ChatbotResponse {
  response: string;
  data?: any;
  error?: boolean;
}

export class ChatbotService {
  private openai: OpenAI | null = null;
  private customersService: CustomersService;
  private dashboardService: DashboardService;
  private payoutsService: PayoutsService;

  constructor() {
    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    this.customersService = new CustomersService();
    this.dashboardService = new DashboardService();
    this.payoutsService = new PayoutsService();
  }

  /**
   * Check if chatbot is enabled and configured
   */
  private isEnabled(): boolean {
    return process.env.CHATBOT_ENABLED === 'true' && !!this.openai;
  }

  /**
   * Process user query and return response
   */
  async processQuery({ query, userId, userRole }: ChatbotQuery): Promise<ChatbotResponse> {
    // Check if chatbot is enabled
    if (!this.isEnabled()) {
      return {
        response: ERROR_MESSAGES.NO_API_KEY,
        error: true,
      };
    }

    // Verify user role is connector
    if (userRole !== 'connector') {
      return {
        response: ERROR_MESSAGES.UNAUTHORIZED,
        error: true,
      };
    }

    try {
      // Call OpenAI with function calling
      const completion = await this.openai!.chat.completions.create({
        model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
        functions: FUNCTION_DEFINITIONS as any,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 500,
      });

      const message = completion.choices[0].message;

      // Check if LLM wants to call a function
      if (message.function_call) {
        const functionName = message.function_call.name;
        const functionArgs = JSON.parse(message.function_call.arguments);

        // Execute the function
        const functionResult = await this.executeFunction(functionName, functionArgs, userId, userRole);

        // Get final response from LLM with function result
        const finalCompletion = await this.openai!.chat.completions.create({
          model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: query },
            message,
            {
              role: 'function',
              name: functionName,
              content: JSON.stringify(functionResult),
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        return {
          response: finalCompletion.choices[0].message.content || ERROR_MESSAGES.GENERAL_ERROR,
          data: functionResult,
        };
      } else {
        // Direct response without function call
        return {
          response: message.content || ERROR_MESSAGES.INVALID_QUERY,
        };
      }
    } catch (error: any) {
      console.error('Chatbot error:', error);
      return {
        response: ERROR_MESSAGES.GENERAL_ERROR,
        error: true,
      };
    }
  }

  /**
   * Execute function called by LLM
   */
  private async executeFunction(
    functionName: string,
    args: any,
    userId: string,
    userRole: string
  ): Promise<any> {
    try {
      switch (functionName) {
        case 'get_customers': {
          const result = await this.customersService.getCustomers(
            {
              status: args.status,
              search: args.search,
              limit: args.limit || 100,
              page: 1,
            },
            userId,
            userRole
          );

          return {
            success: true,
            count: result.pagination.total,
            customers: result.data.map((customer: any) => ({
              id: customer.id,
              name: customer.name,
              mobile: customer.mobile,
              status: customer.status,
              loanType: customer.loanType,
              loanAmount: customer.loanAmount,
              bankName: customer.bank?.name,
              applicationDate: customer.applicationDate,
            })),
          };
        }

        case 'get_dashboard_stats': {
          const result = await this.dashboardService.getDashboardData({
            month: args.month,
            year: args.year,
            userId,
            userRole,
          });

          return {
            success: true,
            statusCounts: result.statusCounts,
            topBanks: result.topBanks,
            topLoanTypes: result.topLoanTypes,
            totalDisbursement: result.totalDisbursement,
            month: args.month,
            year: args.year,
          };
        }

        case 'get_payout_balance': {
          const result = await this.payoutsService.getConnectorBalance(userId);

          return {
            success: true,
            connectorName: result.connectorName,
            totalEarned: result.totalEarned,
            totalAdvance: result.totalAdvance,
            currentBalance: result.currentBalance,
          };
        }

        case 'get_monthly_payouts': {
          const result = await this.payoutsService.getMonthlyPayoutsByConnector(
            userId,
            args.month,
            args.year
          );

          return {
            success: true,
            month: args.month,
            year: args.year,
            payouts: result,
          };
        }

        case 'get_customer_by_id': {
          const result = await this.customersService.getCustomerById(args.customerId, userId, userRole);

          if (!result) {
            return {
              success: false,
              error: 'Customer not found or you do not have permission to view this customer.',
            };
          }

          return {
            success: true,
            customer: {
              id: result.id,
              name: result.name,
              mobile: result.mobile,
              email: result.email,
              status: result.status,
              loanType: result.loanType,
              loanAmount: result.loanAmount,
              bankName: result.bank?.name,
              panNo: result.panNo,
              dateOfBirth: result.dateOfBirth,
            },
          };
        }

        default:
          return {
            success: false,
            error: `Unknown function: ${functionName}`,
          };
      }
    } catch (error: any) {
      console.error(`Error executing function ${functionName}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to execute function',
      };
    }
  }

  /**
   * Get suggested queries for users
   */
  getSuggestions(): string[] {
    return [
      'How many customers do I have?',
      'What is my current balance?',
      'Show my approved loans',
      'Which bank has most disbursements?',
      'What are my payouts this month?',
    ];
  }
}
