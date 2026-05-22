import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { SavePayrollDto } from './dto/save-payroll.dto';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('calculate')
  calculate(
    @Query('employee_id') employeeId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.payrollService.calculatePayroll(Number(employeeId), startDate, endDate);
  }

  @Get('calculate-all')
  calculateAll(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.payrollService.calculatePayrollAll(startDate, endDate);
  }

  @Post('save')
  save(@Body() dto: SavePayrollDto) {
    return this.payrollService.savePayroll(dto);
  }

  @Get('history')
  history(@Query('employee_id') employeeId?: string) {
    return this.payrollService.findHistory(employeeId ? Number(employeeId) : undefined);
  }
}
