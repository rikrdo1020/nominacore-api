import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { SavePayrollDto } from './dto/save-payroll.dto';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('calculate')
  calculate(
    @Query('employee_id') employeeId: string,
    @Query('work_start_date') workStartDate: string,
    @Query('work_end_date') workEndDate: string,
    @Query('deduction_start_date') deductionStartDate: string,
    @Query('deduction_end_date') deductionEndDate: string,
  ) {
    return this.payrollService.calculatePayroll(
      Number(employeeId),
      workStartDate,
      workEndDate,
      deductionStartDate,
      deductionEndDate,
    );
  }

  @Get('calculate-all')
  calculateAll(
    @Query('work_start_date') workStartDate: string,
    @Query('work_end_date') workEndDate: string,
    @Query('deduction_start_date') deductionStartDate: string,
    @Query('deduction_end_date') deductionEndDate: string,
  ) {
    return this.payrollService.calculatePayrollAll(
      workStartDate,
      workEndDate,
      deductionStartDate,
      deductionEndDate,
    );
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
