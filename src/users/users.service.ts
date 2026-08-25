import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const BCRYPT_COST = 12;

const PUBLIC_USER_FIELDS = {
  id: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: PUBLIC_USER_FIELDS,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        role: dto.role ?? Role.ADMIN,
      },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async deactivate(id: number, requestingUserId: number) {
    if (id === requestingUserId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === Role.SUPER_ADMIN && target.isActive) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, isActive: true },
      });

      if (activeSuperAdmins <= 1) {
        throw new ForbiddenException('Cannot deactivate the last active super admin');
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }
}
