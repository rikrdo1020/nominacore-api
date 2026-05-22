import { Module } from '@nestjs/common';
import { DeductionsService } from './deductions.service';
import { DeductionsController } from './deductions.controller';

@Module({
  controllers: [DeductionsController],
  providers: [DeductionsService],
})
export class DeductionsModule {}
