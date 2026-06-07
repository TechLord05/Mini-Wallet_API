const walletService = require('../services/walletService');

const getBalance = async (req, res) => {
    const userId = req.user.userId; // Get the user ID from the authenticated request
    try {
        const user_wallet = await walletService.getBalance(userId); // Get the user's wallet balance using the walletService
        res.status(200).json({ balance: user_wallet }); // Return the wallet balance in the response
    }
    catch (error) {
        res.status(500).json( { message: error.message });

    }
}

const initializePayment = async (req, res) => {
    const email = req.user.email;
    const amount = req.body.amount;
    const userId = req.user.userId;

    try {
        const pay = await walletService.initializePayment(email, amount, userId); // Initialize a payment using the walletService
        res.status(200).json({ authorization_url: pay }); // Return the authorization URL for the payment in the response
        } 
    catch (error) {
        res.status(500).json( { message: error.message });
    }
}

const handleWebhook = async (req, res) => {
    try {
        const process = await walletService.processWebhook(req.body, req.headers['x-paystack-signature']); // Process the webhook from Paystack using the walletService
        res.status(200).json({ message: 'Wallet funded' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const transfer = async (req, res) => {
    const senderId = req.user.userId;
    const { recipientId, amount } = req.body;

    try {
        await walletService.transferFunds(senderId, recipientId, amount); // Transfer funds from the sender to the recipient using the walletService
        res.status(200).json({ message: 'Transfer successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const withdraw = async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;

    try {
        await walletService.withdrawFunds(userId, amount); // Withdraw funds from the user's wallet using the walletService
        res.status(200).json({ message: 'Withdrawal successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTransactions = async (req, res) => {
    const userId = req.user.userId;
    try {
        const transactions = await walletService.getTransactions(userId); // Get the user's transactions using the walletService
        res.status(200).json({ transactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getBalance, initializePayment, handleWebhook, transfer, withdraw, getTransactions };