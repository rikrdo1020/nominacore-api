import { Module } from '@nestjs/common';
import { WorkRecordsService } from './work-records.service';
import { WorkRecordsController } from './work-records.controller';

@Module({
  controllers: [WorkRecordsController],
  providers: [WorkRecordsService],
})
export class WorkRecordsModule {}
