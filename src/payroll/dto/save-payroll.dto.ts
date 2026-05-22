import { IsNumber, IsString } from 'class-validator';

export class SavePayrollDto {
  @IsNumber()
  employeeId: number;

  @IsString()
  periodStart: string;

  @IsString()
  periodEnd: string;

  @IsString()
  paidAt: string;
}
