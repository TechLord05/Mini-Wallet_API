import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawDto {
  @ApiProperty({ example: 500, description: 'Amount to withdraw' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ example: '0000000000', description: 'Recipient bank account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: '057', description: 'Bank code (e.g. 057 for Zenith)' })
  @IsString()
  bankCode: string;

  @ApiProperty({ example: 'Rent payment', description: 'Reason for withdrawal' })
  @IsString()
  narration: string;
}