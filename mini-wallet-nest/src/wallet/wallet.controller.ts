import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('wallet')
export class WalletController {
  constructor(private wallet: WalletService) {}

  @Get('balance')
  getBalance(@Request() req) {
    return this.wallet.getBalance(req.user.userId);
  }

  @Post('fund')
  fund(@Request() req, @Body() body: { amount: number; reference: string }) {
    return this.wallet.fundWallet(req.user.userId, body.amount, body.reference);
  }

  @Post('transfer')
  transfer(@Request() req, @Body() body: { receiverEmail: string; amount: number; narration: string }) {
    return this.wallet.transfer(req.user.userId, body.receiverEmail, body.amount, body.narration);
  }

  @Get('transactions')
  getTransactions(@Request() req) {
    return this.wallet.getTransactions(req.user.userId);
  }
}