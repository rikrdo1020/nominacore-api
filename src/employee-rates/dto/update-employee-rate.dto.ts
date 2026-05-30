import { IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateEmployeeRateDto {
  @IsNumber()
  @IsOptional()
  dayOfWeek?: number;

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
