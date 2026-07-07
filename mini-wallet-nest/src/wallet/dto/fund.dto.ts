import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FundDto {
  @ApiProperty({ example: 2000, description: 'Amount to fund the wallet with' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ example: 'REF-12345', description: 'Unique reference for this funding transaction' })
  @IsString()
  reference: string;
}