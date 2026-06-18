import { IsEmail, IsNumber, IsString, Min } from 'class-validator';

export class TransferDto {
  @IsEmail()
  receiverEmail: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  narration: string;
}