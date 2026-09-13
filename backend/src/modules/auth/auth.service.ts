import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditSeverity } from '../../common/enums/audit-severity.enum';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(user: User): Promise<{
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  }> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const hashedRefreshToken = this.hashToken(refreshToken);

    await this.usersService.updateRefreshTokenHash(user.id, hashedRefreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const sanitized = { ...user };
    delete (sanitized as any).password;
    delete (sanitized as any).refreshTokenHash;
    return sanitized;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.generateTokens(user);

    await this.auditService.log({
      action: 'LOGIN',
      severity: AuditSeverity.INFO,
      actorId: user.id,
      ipAddress,
      userAgent,
      metadata: { method: 'password' },
    });

    return tokens;
  }

  async signup(signupDto: SignupDto, ipAddress?: string, userAgent?: string) {
    const existingUser = await this.usersService.findByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(signupDto);
    const tokens = await this.generateTokens(user);

    await this.auditService.log({
      action: 'USER_REGISTERED',
      severity: AuditSeverity.INFO,
      actorId: user.id,
      ipAddress,
      userAgent,
      metadata: { role: user.role },
    });

    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    if (!userId || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh request');
    }

    const user = await this.usersService.findOne(userId);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied or refresh token revoked');
    }

    const hashedInput = this.hashToken(refreshToken);
    if (hashedInput !== user.refreshTokenHash) {
      // Possible token reuse attack: revoke stored token
      await this.usersService.updateRefreshTokenHash(user.id, null);
      throw new UnauthorizedException('Invalid or reused refresh token');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshTokenHash(userId, null);
    await this.auditService.log({
      action: 'LOGOUT',
      severity: AuditSeverity.INFO,
      actorId: userId,
      metadata: {},
    });
    return { success: true, message: 'Logged out successfully' };
  }

  async demoLogin(role: UserRole = UserRole.DEVELOPER, ipAddress?: string, userAgent?: string) {
    const demoAccounts = {
      [UserRole.ADMIN]: { email: 'admin@idp.local', firstName: 'Platform', lastName: 'Admin' },
      [UserRole.DEVELOPER]: { email: 'developer@idp.local', firstName: 'Dev', lastName: 'Engineer' },
      [UserRole.VIEWER]: { email: 'viewer@idp.local', firstName: 'Demo', lastName: 'Viewer' },
    };

    const account = demoAccounts[role] || demoAccounts[UserRole.DEVELOPER];
    let user = await this.usersService.findByEmail(account.email);

    if (!user) {
      user = await this.usersService.create({
        email: account.email,
        password: crypto.randomBytes(16).toString('hex'),
        firstName: account.firstName,
        lastName: account.lastName,
        role,
      });
    }

    const tokens = await this.generateTokens(user);

    await this.auditService.log({
      action: 'LOGIN',
      severity: AuditSeverity.INFO,
      actorId: user.id,
      ipAddress,
      userAgent,
      metadata: { method: 'demo', role },
    });

    return tokens;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.usersService.setResetPasswordToken(user.email, resetToken);

    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      // Still return generic success for security
    }

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    await this.usersService.updatePassword(user.id, resetPasswordDto.password);
    await this.usersService.clearResetToken(user.id);

    return { message: 'Password has been reset successfully' };
  }
}
