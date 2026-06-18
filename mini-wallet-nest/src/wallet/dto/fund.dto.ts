import { IsNumber, IsString, Min } from 'class-validator';

export class FundDto {
  @IsNumber()
  @Min(100)
  amount: number;

  @IsString()
  reference: string;
}