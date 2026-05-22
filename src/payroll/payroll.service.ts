import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SavePayrollDto } from './dto/save-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async calculatePayroll(employeeId: number, startDate: string, endDate: string) {
    const rateRules = await this.prisma.rateRule.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });

    const workRecords = await this.prisma.workRecord.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    const deductions = await this.prisma.deduction.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalRegularPay = 0;
    let totalOvertimePay = 0;

    for (const wr of workRecords) {
      const d = new Date(wr.date + 'T12:00:00');
      const dayOfWeek = d.getDay();
      const dayOfWeekAdjusted = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday=0 ... Sunday=6
      const rule = rateRules.find(r => r.dayOfWeek === dayOfWeekAdjusted);

      let hoursWorked = 0;
      if (wr.isDirectEntry && wr.directHours) {
        hoursWorked = wr.directHours;
      } else if (wr.entryTime && wr.exitTime) {
        const [eh, em] = wr.entryTime.split(':').map(Number);
        const [xh, xm] = wr.exitTime.split(':').map(Number);
        let entryMin = eh * 60 + em;
        let exitMin = xh * 60 + xm;
        if (exitMin <= entryMin) exitMin += 24 * 60;
        hoursWorked = (exitMin - entryMin) / 60;
      }

      if (rule) {
        const maxReg = rule.maxRegularHours;
        const regRate = rule.regularRate;
        const otRate = rule.overtimeRate;
        const lunchDuration = rule.lunchDuration || 0;
        const netHours = Math.max(0, hoursWorked - lunchDuration);

        if (maxReg > 0 && netHours > maxReg) {
          totalRegularHours += maxReg;
          totalOvertimeHours += netHours - maxReg;
          totalRegularPay += maxReg * regRate;
          totalOvertimePay += (netHours - maxReg) * otRate;
        } else {
          totalRegularHours += netHours;
          totalRegularPay += netHours * (maxReg > 0 ? regRate : otRate);
        }
      }
    }

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const grossPay = totalRegularPay + totalOvertimePay;
    const netPay = grossPay - totalDeductions;

    return {
      employee_id: employeeId,
      period_start: startDate,
      period_end: endDate,
      work_records: workRecords,
      deductions: deductions,
      total_regular_hours: Math.round(totalRegularHours * 100) / 100,
      total_overtime_hours: Math.round(totalOvertimeHours * 100) / 100,
      regular_pay: Math.round(totalRegularPay * 100) / 100,
      overtime_pay: Math.round(totalOvertimePay * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      gross_pay: Math.round(grossPay * 100) / 100,
      net_pay: Math.round(netPay * 100) / 100,
    };
  }

  async calculatePayrollAll(startDate: string, endDate: string) {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const results = [];
    for (const emp of employees) {
      const calc = await this.calculatePayroll(emp.id, startDate, endDate);
      results.push({
        employee_id: emp.id,
        employee_name: emp.name,
        ...calc,
      });
    }
    return results;
  }

  async savePayroll(dto: SavePayrollDto) {
    const calc = await this.calculatePayroll(dto.employeeId, dto.periodStart, dto.periodEnd);
    return this.prisma.payroll.create({
      data: {
        employeeId: dto.employeeId,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        totalRegularHours: calc.total_regular_hours,
        totalOvertimeHours: calc.total_overtime_hours,
        regularPay: calc.regular_pay,
        overtimePay: calc.overtime_pay,
        totalDeductions: calc.total_deductions,
        netPay: calc.net_pay,
        paidAt: new Date(dto.paidAt),
      },
    });
  }

  findHistory(employeeId?: number) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    return this.prisma.payroll.findMany({
      where,
      orderBy: { periodStart: 'desc' },
    });
  }
}
