import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { FundDto } from './dto/fund.dto';
import { TransferDto } from './dto/transfer.dto';

@UseGuards(JwtGuard)
@Controller('wallet')
export class WalletController {
  constructor(private wallet: WalletService) {}

  @Get('balance')
  getBalance(@Request() req) {
    return this.wallet.getBalance(req.user.userId);
  }

  @Post('fund')
  fund(@Request() req, @Body() body: FundDto) {
    return this.wallet.fundWallet(req.user.userId, body.amount, body.reference);
  }

  @Post('transfer')
  transfer(@Request() req, @Body() body: TransferDto) {
    return this.wallet.transfer(req.user.userId, body.receiverEmail, body.amount, body.narration);
  }

  @Get('transactions')
  getTransactions(@Request() req) {
    return this.wallet.getTransactions(req.user.userId);
  }
}