import { IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateEmployeeRateDto {
  @IsNumber()
  employeeId: number;

  @IsNumber()
  dayOfWeek: number;

  @IsNumber()
  @IsOptional()
  maxRegularHours?: number;

  @IsNumber()
  @IsOptional()
  regularRate?: number;

  @IsNumber()
  @IsOptional()
  overtimeRate?: number;

  @IsNumber()
  @IsOptional()
  lunchDuration?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
