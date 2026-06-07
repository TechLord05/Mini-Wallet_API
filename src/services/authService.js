const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const registerUser = async (firstName, lastName, email, password) => {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
        throw new Error('User already exists');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepository.createUser({
        firstName,
        lastName,
        email,
        password: hashed,
        wallet: {
            create: { balance: 0 }
        }
    });
    return user;
}

const loginUser = async (email, password) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
        {userId: user.id, email: user.email},
        process.env.JWT_SECRET,
        {expiresIn: '7d'}
    );

    return token;
}

module.exports = { registerUser, loginUser };