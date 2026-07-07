import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { FundDto } from './dto/fund.dto';
import { TransferDto } from './dto/transfer.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('wallet')
export class WalletController {
  constructor(private wallet: WalletService) {}

  @ApiOperation({ summary: 'Get the current balance for the logged-in user' })
  @Get('balance')
  getBalance(@Request() req) {
    return this.wallet.getBalance(req.user.userId);
  }

  @ApiOperation({ summary: 'Fund the wallet' })
  @Post('fund')
  fund(@Request() req, @Body() body: FundDto) {
    return this.wallet.fundWallet(req.user.userId, body.amount, body.reference);
  }

  @ApiOperation({ summary: 'Transfer money to another user by email' })
  @Post('transfer')
  transfer(@Request() req, @Body() body: TransferDto) {
    return this.wallet.transfer(req.user.userId, body.receiverEmail, body.amount, body.narration);
  }

  @ApiOperation({ summary: 'Get transaction history for the logged-in user' })
  @Get('transactions')
  getTransactions(@Request() req) {
    return this.wallet.getTransactions(req.user.userId);
  }

  @ApiOperation({ summary: 'Withdraw money to a bank account via Paystack' })
  @Post('withdraw')
  withdraw(@Request() req, @Body() body: WithdrawDto) {
    return this.wallet.withdraw(
      req.user.userId,
      body.amount,
      body.accountNumber,
      body.bankCode,
      body.narration,
    );
  }
}