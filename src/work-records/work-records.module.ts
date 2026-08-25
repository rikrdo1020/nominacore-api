import { Module } from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { WorkRecordsController } from './work-records.controller';
import { WorkRecordsVisionService } from './deepseek-vision.service';

@Module({
  controllers: [WorkRecordsController],
  providers: [WorkRecordsService, WorkRecordsVisionService],
})
export class WorkRecordsModule {}
