import { Module } from '@nestjs/common';
import { DeductionsService } from './deductions.service';
import { DeductionsController } from './deductions.controller';
import { DeepseekVisionService } from './deepseek-vision.service';

@Module({
  controllers: [DeductionsController],
  providers: [DeductionsService, DeepseekVisionService],
})
export class DeductionsModule {}
