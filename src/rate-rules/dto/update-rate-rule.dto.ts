import { IsNumber, IsOptional } from 'class-validator';

export class UpdateRateRuleDto {
  @IsNumber()
  maxRegularHours: number;

  @IsNumber()
  regularRate: number;

  @IsNumber()
  overtimeRate: number;

  @IsNumber()
  lunchDuration: number;
}
