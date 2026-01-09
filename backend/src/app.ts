import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import signupRoutes from './routes/signup.routes';
import organizationsRoutes from './routes/organizations.routes';
import invoicesRoutes from './routes/invoices.routes';
// import profileRoutes from './routes/profile.routes';
// import payoutsRoutes from './routes/payouts.routes';
// import dsaInvoiceRoutes from './routes/dsaInvoice.routes';
// import chatbotRoutes from './routes/chatbot.routes';

// Import middleware
import { authenticate } from './middleware/auth';
import { organizationContext } from './middleware/organizationContext';

// Create Express app
const app: Application = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploads)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/pdfs', express.static(path.join(__dirname, '../public/pdfs')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LoanMS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Self-service signup
app.use('/api/signup', signupRoutes);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Apply authentication middleware to all routes below
app.use('/api/*', authenticate);

// Routes that need organization context (multi-tenant data)
app.use('/api/organizations', organizationContext, organizationsRoutes);
app.use('/api/invoices', organizationContext, invoicesRoutes);
// app.use('/api/profile', organizationContext, profileRoutes);
// app.use('/api/payouts', organizationContext, payoutsRoutes);
// app.use('/api/dsa-invoices', organizationContext, dsaInvoiceRoutes);
// app.use('/api/chatbot', organizationContext, chatbotRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      message: err.message,
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: err.message,
    });
  }

  // Default error
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
