import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateDeductionDto {
  @IsNumber()
  employeeId: number;

  @IsString()
  date: string;

  @IsString()
  type: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
