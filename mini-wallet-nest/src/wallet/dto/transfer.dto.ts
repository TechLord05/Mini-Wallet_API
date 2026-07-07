import { IsEmail, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ example: 'receiver@test.com', description: 'Email of the user receiving the transfer' })
  @IsEmail()
  receiverEmail: string;

  @ApiProperty({ example: 1000, description: 'Amount to transfer' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Lunch money', description: 'Reason for the transfer' })
  @IsString()
  narration: string;
}