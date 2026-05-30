import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeRateDto } from './dto/create-employee-rate.dto';
import { UpdateEmployeeRateDto } from './dto/update-employee-rate.dto';

@Injectable()
export class EmployeeRatesService {
  constructor(private prisma: PrismaService) {}

  findAll(employeeId?: number) {
    const where: any = {};
    if (employeeId !== undefined) where.employeeId = employeeId;
    return this.prisma.employeeRate.findMany({
      where,
      orderBy: [{ employeeId: 'asc' }, { dayOfWeek: 'asc' }],
    });
  }

  findOne(id: number) {
    return this.prisma.employeeRate.findUnique({ where: { id } });
  }

  create(dto: CreateEmployeeRateDto) {
    return this.prisma.employeeRate.create({
      data: {
        employeeId: dto.employeeId,
        dayOfWeek: dto.dayOfWeek,
        maxRegularHours: dto.maxRegularHours ?? 8,
        regularRate: dto.regularRate ?? 2.50,
        overtimeRate: dto.overtimeRate ?? 3.00,
        lunchDuration: dto.lunchDuration ?? 0.5,
        isActive: dto.isActive ?? true,
      },
    });
  }

  update(id: number, dto: UpdateEmployeeRateDto) {
    return this.prisma.employeeRate.update({
      where: { id },
      data: {
        ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
        ...(dto.maxRegularHours !== undefined && { maxRegularHours: dto.maxRegularHours }),
        ...(dto.regularRate !== undefined && { regularRate: dto.regularRate }),
        ...(dto.overtimeRate !== undefined && { overtimeRate: dto.overtimeRate }),
        ...(dto.lunchDuration !== undefined && { lunchDuration: dto.lunchDuration }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  remove(id: number) {
    return this.prisma.employeeRate.delete({ where: { id } });
  }
}
