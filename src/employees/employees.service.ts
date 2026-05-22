import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findAll() {
    return this.prisma.employee.findMany({
      orderBy: { name: 'asc' },
    });
  }

  create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: { name: dto.name },
    });
  }

  update(id: number, dto: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  remove(id: number) {
    return this.prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
