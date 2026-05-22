import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
