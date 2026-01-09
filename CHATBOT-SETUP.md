# AI Chatbot Assistant Setup Guide

## Overview
The LoanMS system now includes an AI-powered chatbot assistant for connector users. The chatbot provides conversational access to customer data, loan statuses, payout information, and more using OpenAI's GPT-4o-mini model.

## Features

### What the Chatbot Can Do:
✅ Answer questions about customer counts and statuses
✅ Search for specific customers by name, mobile, or PAN
✅ Provide payout balance and history information
✅ Show dashboard statistics (bank-wise, loan type-wise)
✅ Display loan status breakdowns
✅ Natural language query understanding

### What the Chatbot Cannot Do:
❌ Modify customer data
❌ Create or delete records
❌ Access other users' data
❌ Provide financial advice or recommendations
❌ Execute transactions

## Setup Instructions

### 1. Install Dependencies

The OpenAI package has already been installed in the backend:
```bash
cd backend
npm install openai
```

### 2. Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# AI Chatbot Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_ENABLED=true
```

**To get an OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env` file

**Note:** The OpenAI API is a paid service. Make sure you have credits in your OpenAI account.

### 3. Restart the Backend Server

After configuring the environment variables, restart your backend server:

```bash
cd backend
npm run dev
```

### 4. Test the Chatbot

1. Log in as a connector user (e.g., `connector@loanms.com` / `password123`)
2. You should see a floating bot icon in the bottom-right corner
3. Click the icon to open the chat interface
4. Try asking questions like:
   - "How many customers do I have?"
   - "What is my current balance?"
   - "Show me approved loans"
   - "Which bank has the most disbursements?"

## Architecture

### Backend Components

**File Structure:**
```
backend/src/
├── controllers/chatbot.controller.ts    # Handles HTTP requests
├── services/chatbot.service.ts          # LLM integration & API orchestration
├── routes/chatbot.routes.ts             # API routes
└── utils/chatbotPrompts.ts              # System prompts & configurations
```

**API Endpoints:**
- `POST /api/chatbot/query` - Process user query
- `GET /api/chatbot/suggestions` - Get suggested queries
- `GET /api/chatbot/health` - Check chatbot status

### Frontend Components

**File Structure:**
```
src/
├── components/chatbot/
│   ├── ChatbotWidget.tsx      # Main widget component
│   ├── ChatMessage.tsx        # Message bubble component
│   ├── ChatInput.tsx          # Input field component
│   └── ChatSuggestions.tsx    # Suggestion chips component
├── contexts/ChatbotContext.tsx # State management
└── lib/api.ts                  # API client methods
```

### Data Flow

```
User Query → ChatbotWidget → ChatbotContext → API Client
                                                    ↓
Backend → Controller → Service → OpenAI API
                          ↓
                   Existing Services (customers, dashboard, payouts)
                          ↓
                   Database (PostgreSQL)
                          ↓
Response ← ChatbotWidget ← API Client ← Controller ← Service
```

## Security Features

1. **Authentication Required**: All chatbot endpoints require valid JWT token
2. **Role-Based Access**: Only connector users can access the chatbot
3. **Data Filtering**: All queries are automatically filtered by the user's `connectorId`
4. **Input Validation**: User queries are sanitized before processing
5. **No Direct Database Access**: LLM cannot execute SQL or modify data directly
6. **API Key Security**: OpenAI API key stored in environment variables only

## Usage Examples

### Example Queries:

**Customer Queries:**
- "How many customers do I have?"
- "Show me my approved customers"
- "How many loans are in 'login' status?"
- "Find customer with mobile 9876543210"

**Payout Queries:**
- "What's my current balance?"
- "Show my payouts for January 2024"
- "How much have I earned this month?"
- "What's my total advance?"

**Statistics Queries:**
- "Which bank has the most disbursements?"
- "What's my total loan amount this month?"
- "Show me loan type breakdown"
- "How many disbursed loans do I have?"

**General Queries:**
- "What loan statuses are available?"
- "What can you help me with?"
- "Explain the loan types"

## Customization

### Modifying System Prompts

Edit `backend/src/utils/chatbotPrompts.ts` to customize:
- System behavior and personality
- Available functions and capabilities
- Error messages
- Suggestion queries

### Adding New Functions

To add new query capabilities:

1. Define the function in `chatbotPrompts.ts`:
```typescript
{
  name: 'get_custom_data',
  description: 'Description of what this function does',
  parameters: {
    type: 'object',
    properties: {
      // Define parameters here
    }
  }
}
```

2. Implement the function in `chatbot.service.ts`:
```typescript
case 'get_custom_data': {
  const result = await this.customService.getData(args, userId, userRole);
  return { success: true, data: result };
}
```

## Troubleshooting

### Chatbot Widget Not Visible
- **Check user role**: Only connector users see the chatbot
- **Check backend**: Ensure `CHATBOT_ENABLED=true` in `.env`
- **Check API key**: Verify OpenAI API key is valid
- **Check console**: Look for errors in browser developer console

### "Chatbot is not configured" Error
- **Cause**: Missing or invalid `OPENAI_API_KEY`
- **Solution**: Add valid API key to `backend/.env` and restart server

### "You are not authorized" Error
- **Cause**: User is not a connector
- **Solution**: Log in with a connector account

### Queries Not Working
- **Check OpenAI credits**: Ensure you have credits in your OpenAI account
- **Check network**: Verify backend can reach OpenAI API
- **Check logs**: Look at backend logs for detailed error messages

### Slow Responses
- **Normal**: OpenAI API can take 2-5 seconds to respond
- **Consider**: Using streaming responses (future enhancement)
- **Alternative**: Switch to faster model (gpt-3.5-turbo) in `.env`

## Cost Considerations

**OpenAI Pricing (as of 2024):**
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- GPT-3.5-turbo: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens

**Estimated Usage:**
- Average query: ~500 input tokens + ~300 output tokens
- Cost per query: ~$0.0003 (gpt-4o-mini)
- 1000 queries: ~$0.30

**To reduce costs:**
- Use gpt-4o-mini instead of gpt-4 (already configured)
- Implement caching for common queries (future enhancement)
- Set usage limits in OpenAI dashboard

## Future Enhancements

Potential features for future versions:

1. **Chat History**: Store conversation history in database
2. **Write Actions**: Allow adding remarks, updating customer status
3. **Proactive Insights**: Notify users of important events
4. **Export Capabilities**: Generate reports from chat queries
5. **Voice Interface**: Add speech-to-text and text-to-speech
6. **Multi-language Support**: Support regional languages
7. **Advanced Analytics**: Provide predictive insights
8. **Integration with CRM**: Connect with external systems

## Support

For issues or questions:
1. Check this documentation first
2. Review backend logs: `backend/logs/combined.log`
3. Check browser console for frontend errors
4. Verify OpenAI API status: https://status.openai.com/
5. Contact system administrator

## API Documentation

### POST /api/chatbot/query
Send a natural language query to the chatbot.

**Request:**
```json
{
  "query": "How many approved customers do I have?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "You have 12 approved customers.",
  "data": {
    "count": 12,
    "customers": [...]
  }
}
```

### GET /api/chatbot/suggestions
Get suggested queries for users.

**Response:**
```json
{
  "success": true,
  "data": [
    "How many customers do I have?",
    "What is my current balance?",
    "Show my approved loans"
  ]
}
```

### GET /api/chatbot/health
Check if chatbot service is enabled and configured.

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "model": "gpt-4o-mini"
  }
}
```

## Maintenance

### Regular Tasks:
1. **Monitor OpenAI costs** in the OpenAI dashboard
2. **Review chat logs** for common queries and errors
3. **Update prompts** based on user feedback
4. **Rotate API keys** periodically for security
5. **Check model updates** from OpenAI

### Security Best Practices:
- Never commit `.env` file with real API keys
- Use environment variables for all secrets
- Regularly update OpenAI SDK: `npm update openai`
- Monitor for unusual API usage patterns
- Implement rate limiting (10 requests/minute per user)

---

**Version:** 1.0.0
**Last Updated:** 2026-02-05
**Maintained by:** LoanMS Development Team
