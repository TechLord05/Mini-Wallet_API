import { IsNumber, IsString, Min } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @Min(100)
  amount: number;

  @IsString()
  narration: string;
}