import { Module } from '@nestjs/common';
import { EmployeeRatesController } from './employee-rates.controller';
import { EmployeeRatesService } from './employee-rates.service';

@Module({
  controllers: [EmployeeRatesController],
  providers: [EmployeeRatesService],
})
export class EmployeeRatesModule {}
