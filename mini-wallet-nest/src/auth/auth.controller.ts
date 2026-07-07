import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guards/jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @ApiOperation({ summary: 'Register a new user (creates a wallet automatically)' })
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body.firstName, body.lastName, body.email, body.password);
  }

  @ApiOperation({ summary: 'Log in and receive a JWT' })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the logged-in user\'s profile' })
  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.auth.getMe(req.user.userId);
  }
}