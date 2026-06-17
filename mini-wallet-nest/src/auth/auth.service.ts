import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
    constructor( 
        private prisma: PrismaService,
        private jwt: JwtService
    ) {}

    async register(firstName: string, lastName: string, email: string, password: string) {
        const existing = await this.prisma.user.findUnique({ where: { email }});
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashed,
                wallet: {
                    create: { balance: 0 },
                },
            },
        });

        return { message: 'Registration Successful', userId: user.id };
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email }});
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.jwt.sign({ userId: user.id, email: user.email });
        return { message: 'Login Successful', token };
    }
}
