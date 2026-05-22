import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DeductionsService } from './deductions.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';

@Controller('deductions')
export class DeductionsController {
  constructor(private readonly deductionsService: DeductionsService) {}

  @Get()
  findAll(
    @Query('employee_id') employeeId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.deductionsService.findAll(
      employeeId ? Number(employeeId) : undefined,
      startDate,
      endDate,
    );
  }

  @Post()
  create(@Body() dto: CreateDeductionDto) {
    return this.deductionsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deductionsService.remove(id);
  }
}
