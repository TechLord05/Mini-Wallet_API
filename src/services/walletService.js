const walletRepository = require('../repositories/walletRepository');
const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../prisma'); 

const getBalance = async (userId) => {
    const user_wallet = await walletRepository.findWalletByUserId(userId);
    if(!user_wallet){
        throw new Error('Wallet not found');
    }
    return user_wallet.balance;
}

const initializePayment = async (email, amount, userId) => {
    const reference = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        { email, amount, reference },
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );
    await walletRepository.createTransaction({
        type: 'FUND',
        amount,
        status: 'PENDING',
        reference,
        userId
    });
    return response.data.data.authorization_url;
}

const processWebhook = async (body, signature) => {
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

    if (hash !== signature) {
        throw new Error('Invalid signature');
    }

    const { event, data } = body;

    if (event === 'charge.success') {
        const transaction = await walletRepository.findTransactionByReference(data.reference);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.status === 'SUCCESS') {
            return; // Idempotency check - do nothing if already processed
        }
        await walletRepository.updateTransactionStatus(data.reference, 'SUCCESS');
        await walletRepository.updateWalletBalance(transaction.userId, data.amount / 100, 'increment');
    }
}

const transferFunds = async (SenderId, RecipientId, amount) => {
    const senderWallet = await walletRepository.findWalletByUserId(SenderId);
    const recipientWallet = await walletRepository.findWalletByUserId(RecipientId);

    if (!senderWallet || !recipientWallet) {
        throw new Error('Sender or recipient wallet not found');
    }
    if (senderWallet.balance < amount) {
        throw new Error('Insufficient funds');
    }

    await prisma.$transaction([
    // debit sender
    prisma.wallet.update({
        where: { userId: SenderId },
        data: { balance: { decrement: amount } }
    }),
    // credit recipient
    prisma.wallet.update({
        where: { userId: RecipientId },
        data: { balance: { increment: amount } }
    })
    ]);

    await walletRepository.createTransaction({
        type: 'TRANSFER',
        amount,
        status: 'SUCCESS',
        reference: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: SenderId
    });
}

const withdrawFunds = async (userId, amount) => {
    const userWallet = await walletRepository.findWalletByUserId(userId);
    if (!userWallet) {
        throw new Error('Wallet not found');
    }
    if (userWallet.balance < amount) {
        throw new Error('Insufficient funds');
    }

    await walletRepository.updateWalletBalance(userId, amount, 'decrement');

    await walletRepository.createTransaction({
        type: 'WITHDRAWAL',
        amount,
        status: 'SUCCESS',
        reference: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId
    });
}

const getTransactions = async (userId) => {
    return await walletRepository.findTransactionsByUserId(userId);
}

module.exports = { getBalance, initializePayment, processWebhook, transferFunds, withdrawFunds, getTransactions };