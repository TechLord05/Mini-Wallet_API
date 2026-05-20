const prisma = require('../prisma');
const axios = require('axios');
const crypto = require('crypto');

const getBalance = async (req, res) => {
    const userId = req.user.userId; // Get the user ID from the authenticated request
    try {
        const user_wallet = await prisma.wallet.findUnique( { where: { userId } });
        if(!user_wallet){
            return res.status(404).json( { message: 'Wallet not found' });
        }
       const wallet_balance = user_wallet.balance;

        res.json({ wallet_balance });
    }
    catch (error) {
        res.status(500).json( { message: 'Server Error' });

    }
}

const initializePayment = async (req, res) => {
    const email = req.user.email;
    const amount = req.body.amount;
    const userId = req.user.userId;

    try {
            const reference = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            { email, amount, reference },
            { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
            );
            const user_transact = await prisma.transaction.create({
            data: {
                type: 'FUND',
                amount,
                status: 'PENDING',
                reference,
                userId
            }
            });
            const payment_url = response.data.data.authorization_url;
            res.status(200).json({ payment_url });
        } 
    catch (error) {
        res.status(500).json( { message: 'Server Error' });
    }
}

const handleWebhook = async (req, res) => {
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ message: 'Invalid signature' });
    }

    if (req.body.event !== 'charge.success') {
        return res.status(200).json({ message: 'Event ignored' });
    }
    const { reference, amount } = req.body.data;

    try {
        const transaction = await prisma.transaction.findUnique({ where: {reference} });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.status === 'SUCCESS') {
            return res.status(200).json({ message: 'Already processed' });
        }

        await prisma.$transaction([
            prisma.transaction.update({
                where: { reference },
                data: { status: 'SUCCESS' }
            }),
            prisma.wallet.update({
                where: { userId: transaction.userId },
                data: { balance: { increment: amount / 100 } } // convert kobo to naira
            })
        ]);
        res.status(200).json({ message: 'Wallet funded' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const transfer = async (req, res) => {
    const senderId = req.user.userId;
    const { recipientId, amount } = req.body;

    // can't send money to yourself
    if (senderId === recipientId) {
        return res.status(400).json({ message: 'You cannot transfer to yourself' });
    }
    try {
        // get sender's wallet
        const senderwallet = await prisma.wallet.findUnique({ where: { userId: senderId}});


        if (!senderwallet) {
            return res.status(404).json({ message: 'Sender wallet not found'});
        }

        // check if sender has sufficient balance
        if (senderwallet.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // check if recipient exists
        const recipientwallet = await prisma.wallet.findUnique({ where: { userId: recipientId}});

        if (!recipientwallet) { 
            return res.status(404).json({ message: 'Recipient not found'});
        }

        const reference = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.$transaction([
            // debit sender
            prisma.wallet.update({
                where: { userId: senderId },
                data: { balance: { decrement: amount}}
                }),
            // credit recipient
            prisma.wallet.update({
                where: { userId: recipientId },
                data: { balance: { increment: amount}}
            }),
            // record transaction
            prisma.transaction.create({
                data: {
                    type: 'TRANSFER',
                    amount,
                    status: 'SUCCESS',
                    reference,
                    userId: senderId,
                }
            })
        ]);

        res.status(200).json({ message: 'Transfer successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const withdraw = async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;

    try {
        const user_wallet = await prisma.wallet.findUnique({ where: {userId}});
        if (!user_wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        if (user_wallet.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const reference = `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.$transaction([
            prisma.wallet.update({
                where: { userId },
                data: { balance: { decrement: amount } }
            }),
            prisma.transaction.create({
                data: {
                    type: 'WITHDRAWAL',
                    amount,
                    status: 'SUCCESS',
                    reference,
                    userId
                }
            })
        ]);
        res.status(200).json({ message: 'Withdrawal successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getTransactions = async (req, res) => {
    const userId = req.user.userId;
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ transactions });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getBalance, initializePayment, handleWebhook, transfer, withdraw, getTransactions };

