import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializePaymentDto {
  @ApiProperty({ example: 2000, description: 'Amount to fund via Paystack' })
  @IsNumber()
  @Min(100)
  amount: number;
}