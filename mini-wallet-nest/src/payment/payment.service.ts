import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async initializePayment(userId: string, email: string, amount: number) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }
    
    const reference = `PAY-${Date.now()}`;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      { email, amount: amount * 100, reference },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    await this.prisma.transaction.create({
      data: {
        type: 'FUND',
        amount,
        status: 'PENDING',
        reference,
        userId,
        walletId: wallet.id,
        paymentProvider: 'paystack',
        narration: 'Wallet funding via Paystack',
      },
    });

    return {
      authorizationUrl: response.data.data.authorization_url,
      reference,
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY', '');
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(rawBody.toString());

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      const transaction = await this.prisma.transaction.findUnique({
        where: { reference },
      });

      if (!transaction || transaction.status !== 'PENDING') return;

      await this.prisma.$transaction([
        this.prisma.transaction.update({
          where: { reference },
          data: { status: 'SUCCESS', paymentReference: event.data.id.toString() },
        }),
        this.prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        }),
      ]);
    }

    if (event.event === 'transfer.success') {
      const reference = event.data.reference;

      const transaction = await this.prisma.transaction.findUnique({
        where: { reference },
      });

      if (!transaction || transaction.status !== 'PENDING') return;

      await this.prisma.transaction.update({
        where: { reference },
        data: {
          status: 'SUCCESS',
          paymentReference: event.data.transfer_code,
        },
      });
    }

    if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const reference = event.data.reference;

      const transaction = await this.prisma.transaction.findUnique({
        where: { reference },
      });

      if (!transaction || transaction.status !== 'PENDING') return;

      // refund the wallet and mark transaction failed
      await this.prisma.$transaction([
        this.prisma.transaction.update({
          where: { reference },
          data: { status: 'FAILED' },
        }),
        this.prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        }),
      ]);
    }

    return { received: true };
  }

  async resolveAccount(accountNumber: string, bankCode: string) {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    return {
      accountNumber: response.data.data.account_number,
      accountName: response.data.data.account_name,
    };
  }

  async createTransferRecipient(accountNumber: string, bankCode: string, accountName: string) {
    const response = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    return {
      recipientCode: response.data.data.recipient_code,
    };
  }

  async initiateTransfer(recipientCode: string, amount: number, reference: string, reason: string) {
    const response = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        amount: amount * 100,
        recipient: recipientCode,
        reference,
        reason,
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    return {
      transferCode: response.data.data.transfer_code,
      status: response.data.data.status,
    };
  }
}