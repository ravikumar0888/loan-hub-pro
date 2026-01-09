/**
 * System prompts and configurations for the AI chatbot assistant
 */

export const SYSTEM_PROMPT = `You are an AI assistant for a Loan Management System (LoanMS).

**User Role**: Connector (Loan Agent)

**Your Capabilities**:
You can help users query information about:
- Customer records (filtered to only show their own customers)
- Loan statuses and counts
- Payout balances and history
- Bank and loan type statistics

**Available Loan Statuses**:
- login: Customer has logged in/initiated application
- rejected: Loan application rejected
- approved: Loan application approved
- disbursed: Loan amount disbursed to customer
- hold: Application on hold
- relook: Application needs review
- drop: Application dropped/cancelled

**Available Loan Types**:
- PL: Personal Loan
- HL: Home Loan
- BL: Business Loan

**Important Rules**:
1. ONLY answer questions about the user's own customer data
2. Use ONLY the data provided in the context - never fabricate or guess information
3. Be concise, professional, and helpful
4. If data is unavailable or the question is outside your scope, clearly state this
5. Do NOT provide financial advice or loan recommendations
6. Do NOT access or discuss other users' data
7. Format numbers and currency appropriately (e.g., ₹5,00,000)

**Response Format**:
- For counts/statistics: Provide clear numbers with context
- For customer lists: Present in a structured format if multiple customers
- For errors: Explain what information is unavailable and why

**Example Queries You Can Handle**:
- "How many approved customers do I have?"
- "What's my current payout balance?"
- "Show me customers with disbursed loans"
- "Which bank has the most approvals?"
- "Find customer with mobile number 9876543210"
- "What's my total loan amount this month?"

**Restrictions**:
- You CANNOT modify customer data
- You CANNOT create or delete records
- You CANNOT access admin or backoffice data
- You CANNOT provide predictions or advice`;

export const FUNCTION_DEFINITIONS = [
  {
    name: 'get_customers',
    description: 'Get list of customers with optional filters for status, search term, or date range',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop'],
          description: 'Filter customers by loan status'
        },
        search: {
          type: 'string',
          description: 'Search by customer name, mobile number, or PAN'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of customers to return (default: 100)'
        }
      }
    }
  },
  {
    name: 'get_dashboard_stats',
    description: 'Get dashboard statistics including status counts and bank-wise breakdowns',
    parameters: {
      type: 'object',
      properties: {
        month: {
          type: 'number',
          description: 'Month (1-12) for filtering statistics'
        },
        year: {
          type: 'number',
          description: 'Year for filtering statistics'
        }
      }
    }
  },
  {
    name: 'get_payout_balance',
    description: 'Get connector payout balance (earned vs advance)',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_monthly_payouts',
    description: 'Get monthly payout breakdown with bank-wise details',
    parameters: {
      type: 'object',
      properties: {
        month: {
          type: 'number',
          description: 'Month (1-12)'
        },
        year: {
          type: 'number',
          description: 'Year'
        }
      }
    }
  },
  {
    name: 'get_customer_by_id',
    description: 'Get detailed information about a specific customer',
    parameters: {
      type: 'object',
      properties: {
        customerId: {
          type: 'number',
          description: 'Customer ID'
        }
      },
      required: ['customerId']
    }
  }
];

export const ERROR_MESSAGES = {
  NO_API_KEY: 'Chatbot is not configured. Please contact your administrator to set up the OpenAI API key.',
  CHATBOT_DISABLED: 'Chatbot functionality is currently disabled.',
  RATE_LIMIT: 'You have exceeded the maximum number of queries. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to use the chatbot. Only connector users can access this feature.',
  GENERAL_ERROR: 'Sorry, I encountered an error processing your request. Please try again.',
  NO_DATA: 'I could not find any data matching your query.',
  INVALID_QUERY: 'I did not understand your question. Please try rephrasing it.'
};

export const SUGGESTIONS = [
  'How many customers do I have?',
  'What is my current balance?',
  'Show my approved loans',
  'Which bank has most disbursements?',
  'Find customer by mobile number'
];
