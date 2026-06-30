import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private payment: PaymentService,
  ) {}
  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return { balance: wallet.balance };
  }

  async fundWallet(userId: string, amount: number, reference: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const [transaction, updatedWallet] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          type: 'FUND',
          amount,
          status: 'SUCCESS',
          reference,
          userId,
          walletId: wallet.id,
          narration: 'Wallet funding',
        },
      }),
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      }),
    ]);

    return { message: 'Wallet funded successfully', balance: updatedWallet.balance };
  }

  async transfer(senderId: string, receiverEmail: string, amount: number, narration: string) {
    const senderWallet = await this.prisma.wallet.findUnique({ where: { userId: senderId } });
    if (!senderWallet) throw new NotFoundException('Sender wallet not found');

    if (Number(senderWallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const receiver = await this.prisma.user.findUnique({ where: { email: receiverEmail } });
    if (!receiver) throw new NotFoundException('Receiver not found');

    const receiverWallet = await this.prisma.wallet.findUnique({ where: { userId: receiver.id } });
    if (!receiverWallet) throw new NotFoundException('Receiver wallet not found');

    const reference = `TRF-${Date.now()}`;

    await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          type: 'TRANSFER',
          amount,
          status: 'SUCCESS',
          reference,
          userId: senderId,
          walletId: senderWallet.id,
          receiverWalletId: receiverWallet.id,
          narration,
        },
      }),
      this.prisma.wallet.update({
        where: { userId: senderId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.wallet.update({
        where: { userId: receiver.id },
        data: { balance: { increment: amount } },
      }),
    ]);

    return { message: 'Transfer successful' };
  }

  async getTransactions(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { transactions };
  }

  async withdraw(
  userId: string,
  amount: number,
  accountNumber: string,
  bankCode: string,
  narration: string,
) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Step 1: confirm the account is real
    const resolved = await this.payment.resolveAccount(accountNumber, bankCode);

    // Step 2: create a Paystack recipient for this account
    const recipient = await this.payment.createTransferRecipient(
      accountNumber,
      bankCode,
      resolved.accountName,
    );

    const reference = `WTH-${Date.now()}`;

    // Step 3: debit wallet + create PENDING transaction atomically
    const [, updatedWallet] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          type: 'WITHDRAWAL',
          amount,
          status: 'PENDING',
          reference,
          userId,
          walletId: wallet.id,
          paymentProvider: 'paystack',
          narration,
        },
      }),
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      }),
    ]);

    // Step 4: initiate the actual transfer
    try {
      await this.payment.initiateTransfer(
        recipient.recipientCode,
        amount,
        reference,
        narration,
      );
    } catch (err) {
      // Transfer call itself failed — refund immediately, don't wait for webhook
      await this.prisma.$transaction([
        this.prisma.transaction.update({
          where: { reference },
          data: { status: 'FAILED' },
        }),
        this.prisma.wallet.update({
          where: { userId },
          data: { balance: { increment: amount } },
        }),
      ]);
      throw new BadRequestException('Transfer initiation failed, wallet refunded');
    }

    return {
      message: 'Withdrawal initiated, pending confirmation',
      balance: updatedWallet.balance,
      accountName: resolved.accountName,
    };
  }
}