import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: any;
  let payment: any;

  beforeEach(async () => {
    // Fake versions of PrismaService and PaymentService —
    // jest.fn() creates a mock function we can control per test
    const mockPrisma = {
      wallet: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockPayment = {
      resolveAccount: jest.fn(),
      createTransferRecipient: jest.fn(),
      initiateTransfer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentService, useValue: mockPayment },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get(PrismaService);
    payment = module.get(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('throws NotFoundException if wallet does not exist', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.getBalance('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the balance if wallet exists', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ balance: 5000 });

      const result = await service.getBalance('user-1');

      expect(result).toEqual({ balance: 5000 });
    });
  });

  describe('withdraw', () => {
    it('throws BadRequestException if balance is insufficient', async () => {
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        balance: 1000,
      });

      await expect(
        service.withdraw('user-1', 5000, '0000000000', '057', 'test'),
      ).rejects.toThrow(BadRequestException);

      // Critical check: money must NEVER move if the balance check fails.
      // If this ever fails, it means a bug could let money leave without funds to back it.
      expect(payment.resolveAccount).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if wallet does not exist', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      await expect(
        service.withdraw('user-1', 500, '0000000000', '057', 'test'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});