const prisma = require('../prisma');

const findByEmail = async (email) => {
    return await prisma.user.findUnique({ where: { email } });
}

const findById = async (id) => {
    return await prisma.user.findUnique({ where: { id } });
}

const createUser = async (data) => {
    return await prisma.user.create({ data });
}

module.exports = { findByEmail, findById, createUser };