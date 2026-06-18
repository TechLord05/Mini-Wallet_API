# Mini Wallet API

A fintech wallet REST API built with two implementations:
- **Express** (layered architecture — Controllers → Services → Repositories)
- **NestJS** (modules, dependency injection, guards, DTOs)

Both share the same core logic and database schema.

---

## Features

- JWT Authentication (register, login, profile)
- Wallet funding, transfers between users, balance check
- Transaction history
- Paystack payment integration with webhook signature verification
- Atomic transactions — debit and credit in a single DB operation
- Input validation with class-validator DTOs
- PostgreSQL + Prisma ORM

---

## Tech Stack

NestJS · Node.js · TypeScript · PostgreSQL · Prisma · JWT · Paystack · bcryptjs

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register a new user |
| POST | /auth/login | No | Login and get JWT token |
| GET | /auth/me | Yes | Get logged-in user profile |

### Wallet
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /wallet/balance | Yes | Get wallet balance |
| POST | /wallet/fund | Yes | Fund wallet directly |
| POST | /wallet/transfer | Yes | Transfer to another user |
| GET | /wallet/transactions | Yes | Get transaction history |

### Payment
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /payment/initialize | Yes | Initialize Paystack payment |
| POST | /payment/webhook | No | Paystack webhook handler |

---

## Setup (NestJS)

```bash
cd mini-wallet-nest
npm install
```

Create a `.env` file:
```env
DATABASE_URL="your_postgres_url"
JWT_SECRET="your_jwt_secret"
PAYSTACK_SECRET_KEY="your_paystack_secret_key"
PORT=3000
```

Run migrations and start:
```bash
npx prisma migrate dev
npm run start:dev
```

---

## Key Design Decisions

**Atomic transfers** — wallet debits and credits are wrapped in `prisma.$transaction()` so money can never disappear if one operation fails.

**Webhook signature verification** — Paystack webhooks are verified using HMAC-SHA512 before any wallet is credited, preventing fake payment events.

**DTO validation** — all incoming request bodies are validated against typed DTOs using class-validator, rejecting malformed or unexpected input before it reaches business logic.