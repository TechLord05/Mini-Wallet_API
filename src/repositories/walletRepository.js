const prisma = require('../prisma');

const findWalletByUserId = async (userId) => {
    return await prisma.wallet.findUnique({ where: { userId } });
}

const updateWalletBalance =  async (userId, amount, operation) => {
    if (operation === 'increment')
    {
        return await prisma.wallet.update({
            where: { userId },
            data: { balance: { increment: amount } }
        });
    }
    else if (operation === 'decrement')
    {
        return await prisma.wallet.update({
            where: { userId },
            data: { balance: { decrement: amount } }
        });
    }
    else
    {
        throw new Error('Invalid operation');
    }
}

const createTransaction = async (data) => {
    return await prisma.transaction.create({ data });
}

const findTransactionByReference = async (reference) => {
    return await prisma.transaction.findUnique({ where: { reference } });
}

const updateTransactionStatus = async (reference, status) => {
    return await prisma.transaction.update({
        where: { reference },
        data: { status }
    });
}

const findTransactionsByUserId = async (userId) => {
    return await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
}


module.exports = { findWalletByUserId, updateWalletBalance, createTransaction, findTransactionByReference, updateTransactionStatus, findTransactionsByUserId };