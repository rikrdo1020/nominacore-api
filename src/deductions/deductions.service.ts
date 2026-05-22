import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';

@Injectable()
export class DeductionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(employeeId?: number, startDate?: string, endDate?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const deductions = await this.prisma.deduction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { employee: { select: { name: true } } },
    });

    return deductions.map(d => ({
      ...d,
      employee_name: d.employee?.name || null,
    }));
  }

  create(dto: CreateDeductionDto) {
    return this.prisma.deduction.create({
      data: {
        employeeId: dto.employeeId,
        date: dto.date,
        type: dto.type,
        amount: dto.amount,
        description: dto.description || null,
      },
    });
  }

  remove(id: number) {
    return this.prisma.deduction.delete({ where: { id } });
  }
}
