import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeesModule } from './employees/employees.module';
import { RateRulesModule } from './rate-rules/rate-rules.module';
import { WorkRecordsModule } from './work-records/work-records.module';
import { DeductionsModule } from './deductions/deductions.module';
import { PayrollModule } from './payroll/payroll.module';
import { EmployeeRatesModule } from './employee-rates/employee-rates.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    RateRulesModule,
    WorkRecordsModule,
    DeductionsModule,
    PayrollModule,
    EmployeeRatesModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
