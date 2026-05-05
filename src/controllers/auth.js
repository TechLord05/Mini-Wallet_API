const prisma = require('../prisma'); // Import the Prisma client instance
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing
const jwt = require('jsonwebtoken'); // Import the JWT secret from environment variables

// Register a new user
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body; // Extract user details from the request body

        // Check if the user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'User already exists' }); // Return an error if the user already exists
        }

        // Hash the password before storing it
        const hashed = await bcrypt.hash(password, 10); // Hash the password with a salt round of 10

        // create user && wallet in one transaction - both must succeed or fail together
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashed, // Store the hashed password
                wallet: {
                    create: { balance: 0 } // Create an associated wallet for the user with an initial balance of 0
                }
            }
        });
        res.status(201).json({ message: 'Registration successful', userId: user.id }); // Return a success message upon successful registration
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message }); // Return a server error message if something goes wrong
    }
};

// Login an existing user
const login = async (req, res) => {
    try {
        const { email, password } = req.body; // Extract email and password from the request body

        // find user by email
        const user = await prisma.user.findUnique({ where: { email} });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' }); // Return an error if the user is not found
        }

        // Compare entered password with hashed password in the db
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Invalid credentials' }); // Return an error if the password does not match
        }

        // Generate a JWT token - expires in 7 days
        const token = jwt.sign(
            {userId: user.id, email: user.email}, //Payload
            process.env.JWT_SECRET, // Secret key from environment variables
            {expiresIn: '7d'} // Token expiration time
        );

        res.json({ message: 'Login successful', token }); // Return a success message and the generated token upon successful login
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message }); // Return a server error message if something goes wrong 
    }
};

module.exports =  { register, login }; // Export the register and login functions for use in other parts of the application
