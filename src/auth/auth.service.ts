import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_COST } from '../common/password.util';

const PUBLIC_USER_FIELDS = {
  id: true,
  username: true,
  role: true,
  mustChangePassword: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { username } });

    // Same error/message whether the username doesn't exist or the password is wrong,
    // so we never leak which case occurred.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  login(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as StringValue,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  getMe(userId: number) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Not UnauthorizedException (401): the JWT is valid, only the submitted
    // current-password value is wrong. A 401 here would trip the renderer's
    // global "session expired" handler (see preload.ts handleResponse),
    // force-logging the user out instead of showing an inline form error.
    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    return { success: true };
  }
}
