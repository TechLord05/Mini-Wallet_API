import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ife@test.com', description: 'Registered email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Account password' })
  @IsString()
  password: string;
}