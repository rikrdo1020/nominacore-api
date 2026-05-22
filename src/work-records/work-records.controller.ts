import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { UpdateWorkRecordDto } from './dto/update-work-record.dto';

@Controller('work-records')
export class WorkRecordsController {
  constructor(private readonly workRecordsService: WorkRecordsService) {}

  @Get()
  findAll(
    @Query('employee_id') employeeId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    if (employeeId) {
      return this.workRecordsService.findAll(Number(employeeId), startDate, endDate);
    }
    return this.workRecordsService.findAllWithEmployee(startDate, endDate);
  }

  @Post()
  create(@Body() dto: CreateWorkRecordDto) {
    return this.workRecordsService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkRecordDto) {
    return this.workRecordsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workRecordsService.remove(id);
  }
}
