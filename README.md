# Mini Wallet API

A fintech wallet REST API built with Node.js, Express, PostgreSQL, and Prisma ORM.

## Features
- User registration and authentication (JWT)
- Wallet creation per user
- Fund wallet
- Wallet-to-wallet transfers
- Balance enquiry

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (JSON Web Tokens)

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/wallet/fund` | Fund your wallet |
| POST | `/wallet/transfer` | Transfer to another wallet |
| GET | `/wallet/balance` | Get wallet balance |

## Setup

```bash
git clone https://github.com/TechLord05/Mini-Wallet_API.git
cd Mini-Wallet_API
npm install
```

Create a `.env` file:


DATABASE_URL=postgresql://user:password@localhost:5432/wallet_db
JWT_SECRET=your_jwt_secret

Run migrations:
```bash
npx prisma migrate dev
```

Start the server:
```bash
npm run dev
```