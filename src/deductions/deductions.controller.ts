import { BadRequestException, Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DeductionsService } from './deductions.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { ExtractDeductionsDto } from './dto/extract-deductions.dto';
import { MAX_TOTAL_BATCH_BYTES } from '../common/dto/extract-image.dto';
import { DeepseekVisionService } from './deepseek-vision.service';

@Controller('deductions')
export class DeductionsController {
  constructor(
    private readonly deductionsService: DeductionsService,
    private readonly deepseekVisionService: DeepseekVisionService,
  ) {}

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

  @Post('extract')
  extract(@Body() dto: ExtractDeductionsDto) {
    const totalBytes = dto.images.reduce((sum, img) => sum + (img.base64.length * 3) / 4, 0);
    if (totalBytes > MAX_TOTAL_BATCH_BYTES) {
      throw new BadRequestException(
        `El total de imágenes supera ${Math.floor(MAX_TOTAL_BATCH_BYTES / (1024 * 1024))}MB, reduce la cantidad o el tamaño`,
      );
    }
    return this.deepseekVisionService.extractAll(dto.images);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deductionsService.remove(id);
  }
}
