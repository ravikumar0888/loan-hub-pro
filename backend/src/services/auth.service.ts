import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generatePasswordResetToken } from '../utils/jwt';
import { AuthUser } from '../types';
import { PASSWORD_RESET_EXPIRY } from '../config/constants';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const authUser: AuthUser = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(authUser);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If email exists, password reset link has been sent' };
    }

    const token = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: Send email with reset link
    // const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
    // await sendPasswordResetEmail(user.email, resetLink);

    return { message: 'If email exists, password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used) {
      throw new Error('Invalid or expired token');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new Error('Token has expired');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Password reset successful' };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
