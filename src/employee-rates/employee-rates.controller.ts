import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EmployeeRatesService } from './employee-rates.service';
import { CreateEmployeeRateDto } from './dto/create-employee-rate.dto';
import { UpdateEmployeeRateDto } from './dto/update-employee-rate.dto';

@Controller('employee-rates')
export class EmployeeRatesController {
  constructor(private readonly employeeRatesService: EmployeeRatesService) {}

  @Get()
  findAll(@Query('employee_id') employeeId?: string) {
    const id = employeeId ? parseInt(employeeId, 10) : undefined;
    return this.employeeRatesService.findAll(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeRatesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEmployeeRateDto) {
    return this.employeeRatesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeeRateDto) {
    return this.employeeRatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeeRatesService.remove(id);
  }
}
