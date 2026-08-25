import { BadRequestException, Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { CreateWorkRecordDto } from './dto/create-work-record.dto';
import { UpdateWorkRecordDto } from './dto/update-work-record.dto';
import { ExtractWorkRecordsDto } from './dto/extract-work-records.dto';
import { WorkRecordsVisionService } from './deepseek-vision.service';
import { MAX_TOTAL_BATCH_BYTES } from '../common/dto/extract-image.dto';

@Controller('work-records')
export class WorkRecordsController {
  constructor(
    private readonly workRecordsService: WorkRecordsService,
    private readonly workRecordsVisionService: WorkRecordsVisionService,
  ) {}

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

  @Post('extract')
  extract(@Body() dto: ExtractWorkRecordsDto) {
    const totalBytes = dto.images.reduce((sum, img) => sum + (img.base64.length * 3) / 4, 0);
    if (totalBytes > MAX_TOTAL_BATCH_BYTES) {
      throw new BadRequestException(
        `El total de imágenes supera ${Math.floor(MAX_TOTAL_BATCH_BYTES / (1024 * 1024))}MB, reduce la cantidad o el tamaño`,
      );
    }
    return this.workRecordsVisionService.extractAll(dto.images);
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
