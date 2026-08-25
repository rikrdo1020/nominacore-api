import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_COST = 12;

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.bootstrapSuperAdmin();
  }

  private async bootstrapSuperAdmin() {
    const username = process.env.SUPER_ADMIN_USERNAME;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!username || !password) {
      this.logger.warn(
        'SUPER_ADMIN_USERNAME / SUPER_ADMIN_PASSWORD not set — skipping super admin bootstrap.',
      );
      return;
    }

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    await this.prisma.user.create({
      data: {
        username,
        passwordHash,
        role: Role.SUPER_ADMIN,
      },
    });

    this.logger.log(`Super admin user "${username}" bootstrapped.`);
  }
}
