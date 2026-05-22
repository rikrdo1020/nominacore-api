import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateWorkRecordDto {
  @IsNumber()
  employeeId: number;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  entryTime?: string;

  @IsOptional()
  @IsString()
  exitTime?: string;

  @IsOptional()
  @IsNumber()
  directHours?: number;

  @IsBoolean()
  isDirectEntry: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
