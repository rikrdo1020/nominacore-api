import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeesModule } from './employees/employees.module';
import { RateRulesModule } from './rate-rules/rate-rules.module';
import { WorkRecordsModule } from './work-records/work-records.module';
import { DeductionsModule } from './deductions/deductions.module';
import { PayrollModule } from './payroll/payroll.module';
import { EmployeeRatesModule } from './employee-rates/employee-rates.module';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    EmployeesModule,
    RateRulesModule,
    WorkRecordsModule,
    DeductionsModule,
    PayrollModule,
    EmployeeRatesModule,
  ],
  providers: [AppService],
})
export class AppModule {}
