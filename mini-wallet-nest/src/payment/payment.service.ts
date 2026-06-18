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

    return { received: true };
  }
}