const walletService = require('../services/walletService');
const { sendSuccess, sendError } = require('../utils/response');

const getBalance = async (req, res) => {
    const userId = req.user.userId;
    try {
        const balance = await walletService.getBalance(userId);
        sendSuccess(res, { balance }, 200);
    } catch (error) {
        if (error.message === 'Wallet not found') {
            return sendError(res, error.message, 'WALLET_NOT_FOUND', 404);
        }
        sendError(res, error.message, 'INTERNAL_SERVER_ERROR', 500);
    }
};

const initializePayment = async (req, res) => {
    const email = req.user.email;
    const amount = req.body.amount;
    const userId = req.user.userId;
    try {
        const pay = await walletService.initializePayment(email, amount, userId);
        sendSuccess(res, { authorization_url: pay }, 200);
    } catch (error) {
        if (error.message === 'Wallet not found') {
            return sendError(res, error.message, 'WALLET_NOT_FOUND', 404);
        }
        sendError(res, error.message, 'INTERNAL_SERVER_ERROR', 500);
    }
};

const handleWebhook = async (req, res) => {
    try {
        await walletService.processWebhook(req.body, req.headers['x-paystack-signature']);
        sendSuccess(res, { message: 'Wallet funded' }, 200);
    } catch (error) {
        if (error.message === 'Invalid signature') {
            return sendError(res, error.message, 'INVALID_SIGNATURE', 401);
        }
        if (error.message === 'Transaction not found') {
            return sendError(res, error.message, 'TRANSACTION_NOT_FOUND', 404);
        }
        sendError(res, error.message, 'INTERNAL_SERVER_ERROR', 500);
    }
};

const transfer = async (req, res) => {
    const senderId = req.user.userId;
    const { recipientId, amount } = req.body;
    try {
        await walletService.transferFunds(senderId, recipientId, amount);
        sendSuccess(res, { message: 'Transfer successful' }, 200);
    } catch (error) {
        if (error.message === 'Insufficient funds') {
            return sendError(res, error.message, 'INSUFFICIENT_FUNDS', 400);
        }
        if (error.message === 'Sender or recipient wallet not found') {
            return sendError(res, error.message, 'WALLET_NOT_FOUND', 404);
        }
        sendError(res, error.message, 'INTERNAL_SERVER_ERROR', 500);
    }
};

const withdraw = async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;
    try {
        await walletService.withdrawFunds(userId, amount);
        sendSuccess(res, { message: 'Withdrawal successful' }, 200);
    } catch (error) {
        if (error.message === 'Insufficient funds') {
            return sendError(res, error.message, 'INSUFFICIENT_FUNDS', 400);
        }
        if (error.message === 'Wallet not found') {
            return sendError(res, error.message, 'WALLET_NOT_FOUND', 404);
        }
        sendError(res, error.message, 'INTERNAL_SERVER_ERROR', 500);
    }
};

const getTransactions = async (req, res) => {
    const userId = req.user.userId;
    try {
        const transactions = await walletService.getTransactions(userId);
        sendSuccess(res, { transactions }, 200);
    } catch (error) {
        sendError(res, error.message, 'INTERNAL_SERVER_ERROR', 500);
    }
};

module.exports = { getBalance, initializePayment, handleWebhook, transfer, withdraw, getTransactions };