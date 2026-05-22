import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { UpdateWorkRecordDto } from './dto/update-work-record.dto';

@Injectable()
export class WorkRecordsService {
  constructor(private prisma: PrismaService) {}

  async findAll(employeeId?: number, startDate?: string, endDate?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const records = await this.prisma.workRecord.findMany({
      where,
      orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
      include: { employee: { select: { name: true } } },
    });

    return records.map(r => ({
      ...r,
      employee_name: r.employee?.name || null,
    }));
  }

  async findAllWithEmployee(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const records = await this.prisma.workRecord.findMany({
      where,
      orderBy: [{ date: 'desc' }, { employee: { name: 'asc' } }],
      include: { employee: { select: { name: true } } },
    });

    return records.map(r => ({
      ...r,
      employee_name: r.employee?.name || null,
    }));
  }

  create(dto: CreateWorkRecordDto) {
    return this.prisma.workRecord.create({
      data: {
        employeeId: dto.employeeId,
        date: dto.date,
        entryTime: dto.entryTime || null,
        exitTime: dto.exitTime || null,
        directHours: dto.directHours || null,
        isDirectEntry: dto.isDirectEntry,
        notes: dto.notes || null,
      },
    });
  }

  update(id: number, dto: UpdateWorkRecordDto) {
    return this.prisma.workRecord.update({
      where: { id },
      data: {
        entryTime: dto.entryTime || null,
        exitTime: dto.exitTime || null,
        directHours: dto.directHours || null,
        isDirectEntry: dto.isDirectEntry,
        notes: dto.notes || null,
      },
    });
  }

  remove(id: number) {
    return this.prisma.workRecord.delete({ where: { id } });
  }
}
