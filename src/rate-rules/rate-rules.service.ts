import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRateRuleDto } from './dto/update-rate-rule.dto';

@Injectable()
export class RateRulesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.rateRule.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  update(id: number, dto: UpdateRateRuleDto) {
    return this.prisma.rateRule.update({
      where: { id },
      data: {
        maxRegularHours: dto.maxRegularHours,
        regularRate: dto.regularRate,
        overtimeRate: dto.overtimeRate,
        lunchDuration: dto.lunchDuration,
      },
    });
  }

  async seedDefaults() {
    const count = await this.prisma.rateRule.count();
    if (count > 0) return;

    const days = [
      { dow: 0, name: 'Lunes', max: 8, reg: 2.50, ot: 3.00, lunch: 0.5 },
      { dow: 1, name: 'Martes', max: 8, reg: 2.50, ot: 3.00, lunch: 0.5 },
      { dow: 2, name: 'Miércoles', max: 8, reg: 2.50, ot: 3.00, lunch: 0.5 },
      { dow: 3, name: 'Jueves', max: 8, reg: 2.50, ot: 3.00, lunch: 0.5 },
      { dow: 4, name: 'Viernes', max: 8, reg: 2.50, ot: 3.00, lunch: 0.5 },
      { dow: 5, name: 'Sábado', max: 8, reg: 2.50, ot: 3.00, lunch: 0.5 },
      { dow: 6, name: 'Domingo', max: 0, reg: 3.00, ot: 3.00, lunch: 0.5 },
    ];

    await this.prisma.rateRule.createMany({
      data: days.map(d => ({
        dayOfWeek: d.dow,
        dayName: d.name,
        maxRegularHours: d.max,
        regularRate: d.reg,
        overtimeRate: d.ot,
        lunchDuration: d.lunch,
      })),
    });
  }
}
