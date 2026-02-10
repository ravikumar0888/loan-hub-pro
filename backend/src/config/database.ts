import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Global reference to prevent multiple instances
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Reuse existing connection or create new one
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Store in global to reuse across hot reloads (development) and module imports
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Test database connection
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

export default prisma;
