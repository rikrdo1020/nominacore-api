import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SavePayrollDto } from './dto/save-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async calculatePayroll(
    employeeId: number,
    workStartDate: string,
    workEndDate: string,
    deductionStartDate: string,
    deductionEndDate: string,
  ) {
    const rateRules = await this.prisma.rateRule.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });

    const employeeRates = await this.prisma.employeeRate.findMany({
      where: { employeeId, isActive: true },
    });

    const workRecordsRaw = await this.prisma.workRecord.findMany({
      where: {
        employeeId,
        date: { gte: workStartDate, lte: workEndDate },
      },
      orderBy: { date: 'asc' },
    });

    // Deduplicate by date — keep last entry per date (most recently inserted wins)
    const workRecordMap = new Map<string, typeof workRecordsRaw[0]>();
    for (const wr of workRecordsRaw) {
      workRecordMap.set(wr.date, wr);
    }
    const workRecords = Array.from(workRecordMap.values());

    const deductions = await this.prisma.deduction.findMany({
      where: {
        employeeId,
        date: { gte: deductionStartDate, lte: deductionEndDate },
      },
      orderBy: { date: 'desc' },
    });

    // Map deductions by date
    const deductionsByDate = new Map<string, number>();
    for (const d of deductions) {
      deductionsByDate.set(d.date, (deductionsByDate.get(d.date) || 0) + d.amount);
    }

    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalRegularPay = 0;
    let totalOvertimePay = 0;
    const dailyBreakdown: {
      date: string;
      regular_hours: number;
      overtime_hours: number;
      regular_pay: number;
      overtime_pay: number;
      daily_total: number;
      deductions: number;
    }[] = [];

    for (const wr of workRecords) {
      const dateStr = wr.date;
      const d = new Date(dateStr + 'T12:00:00');
      const dayOfWeek = d.getDay();
      const dayOfWeekAdjusted = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday=0 ... Sunday=6
      const employeeRate = employeeRates.find(r => r.dayOfWeek === dayOfWeekAdjusted);
      const rule = employeeRate || rateRules.find(r => r.dayOfWeek === dayOfWeekAdjusted);

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

      let regHours = 0;
      let otHours = 0;
      let regPay = 0;
      let otPay = 0;

      if (rule) {
        const maxReg = rule.maxRegularHours;
        const regRate = rule.regularRate;
        const otRate = rule.overtimeRate;
        const lunchDuration = rule.lunchDuration || 0;
        const netHours = Math.max(0, hoursWorked - lunchDuration);

        if (maxReg > 0 && netHours > maxReg) {
          regHours = maxReg;
          otHours = netHours - maxReg;
          regPay = maxReg * regRate;
          otPay = (netHours - maxReg) * otRate;
        } else {
          regHours = netHours;
          regPay = netHours * (maxReg > 0 ? regRate : otRate);
        }
      }

      totalRegularHours += regHours;
      totalOvertimeHours += otHours;
      totalRegularPay += regPay;
      totalOvertimePay += otPay;

      dailyBreakdown.push({
        date: dateStr,
        regular_hours: regHours,
        overtime_hours: otHours,
        regular_pay: regPay,
        overtime_pay: otPay,
        daily_total: regPay + otPay,
        deductions: deductionsByDate.get(dateStr) || 0,
      });
    }

    // Agregar días que solo tienen descuentos (sin registro de trabajo)
    const processedDates = new Set(dailyBreakdown.map(db => db.date));
    for (const [dateStr, amount] of deductionsByDate.entries()) {
      if (!processedDates.has(dateStr)) {
        dailyBreakdown.push({
          date: dateStr,
          regular_hours: 0,
          overtime_hours: 0,
          regular_pay: 0,
          overtime_pay: 0,
          daily_total: 0,
          deductions: amount,
        });
      }
    }

    // Ordenar desglose por fecha
    dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date));

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const grossPay = totalRegularPay + totalOvertimePay;
    const netPay = grossPay - totalDeductions;

    const periodStart = workStartDate < deductionStartDate ? workStartDate : deductionStartDate;
    const periodEnd = workEndDate > deductionEndDate ? workEndDate : deductionEndDate;

    return {
      employee_id: employeeId,
      period_start: periodStart,
      period_end: periodEnd,
      work_records: workRecords,
      deductions: deductions,
      daily_breakdown: dailyBreakdown,
      total_regular_hours: totalRegularHours,
      total_overtime_hours: totalOvertimeHours,
      regular_pay: totalRegularPay,
      overtime_pay: totalOvertimePay,
      total_deductions: totalDeductions,
      gross_pay: grossPay,
      net_pay: netPay,
    };
  }

  async calculatePayrollAll(
    workStartDate: string,
    workEndDate: string,
    deductionStartDate: string,
    deductionEndDate: string,
  ) {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const results = [];
    for (const emp of employees) {
      const calc = await this.calculatePayroll(
        emp.id,
        workStartDate,
        workEndDate,
        deductionStartDate,
        deductionEndDate,
      );
      results.push({
        employee_id: emp.id,
        employee_name: emp.name,
        ...calc,
      });
    }
    return results;
  }

  async savePayroll(dto: SavePayrollDto) {
    const calc = await this.calculatePayroll(dto.employeeId, dto.periodStart, dto.periodEnd, dto.periodStart, dto.periodEnd);
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
