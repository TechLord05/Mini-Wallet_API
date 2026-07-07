import { Controller, Post, Body, UseGuards, Request, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { InitializePaymentDto } from './dto/initialize.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private payment: PaymentService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize a Paystack payment to fund the wallet' })
  @UseGuards(JwtGuard)
  @Post('initialize')
  initialize(@Request() req, @Body() body: InitializePaymentDto) {
    return this.payment.initializePayment(req.user.userId, req.user.email, body.amount);
  }

  @ApiExcludeEndpoint()
  @Post('webhook')
  webhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: any,
  ) {
    return this.payment.handleWebhook(signature, req.rawBody);
  }
}