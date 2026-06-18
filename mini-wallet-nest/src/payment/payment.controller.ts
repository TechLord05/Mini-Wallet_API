import { Controller, Post, Body, UseGuards, Request, Headers, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { InitializePaymentDto } from './dto/initialize.dto';

@Controller('payment')
export class PaymentController {
  constructor(private payment: PaymentService) {}

  @UseGuards(JwtGuard)
  @Post('initialize')
  initialize(@Request() req, @Body() body: InitializePaymentDto) {
    return this.payment.initializePayment(req.user.userId, req.user.email, body.amount);
  }

  @Post('webhook')
  webhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: any,
  ) {
    return this.payment.handleWebhook(signature, req.rawBody);
  }
}