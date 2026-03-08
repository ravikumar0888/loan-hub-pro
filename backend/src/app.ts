import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import signupRoutes from './routes/signup.routes';
import organizationsRoutes from './routes/organizations.routes';
import invoicesRoutes from './routes/invoices.routes';
import customersRoutes from './routes/customers.routes';
import banksRoutes from './routes/banks.routes';
import usersRoutes from './routes/users.routes';
import dsasRoutes from './routes/dsas.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportsRoutes from './routes/reports.routes';
import payoutsRoutes from './routes/payouts.routes';
import profileRoutes from './routes/profile.routes';
import notificationsRoutes from './routes/notifications.routes';
import dsaInvoiceRoutes from './routes/dsaInvoice.routes';
import backupRoutes from './routes/backup.routes';

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

// Rate limiting - prevent too many requests
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute window
  max: 100,                  // Max 100 requests per minute per IP
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,     // Return rate limit info in headers
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Static files (for uploads and PDFs)
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use('/pdfs', express.static(path.join(process.cwd(), 'public/pdfs')));

// Disable caching for all API routes
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
});

// Request logging (async via winston - no blocking)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
}

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

// Routes that need organization context (multi-tenant data)
// Note: Each route file has authenticate middleware applied internally
app.use('/api/organizations', organizationsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/banks', banksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dsas', dsasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/payouts', payoutsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dsa-invoices', dsaInvoiceRoutes);
app.use('/api/backup', backupRoutes);

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
  logger.error(`${req.method} ${req.url} - ${err.message}`);

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
