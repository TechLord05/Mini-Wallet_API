import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Ifeoluwa', description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Adebayo', description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'ife@test.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;
}