const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');


// Register a new user
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const user = await authService.registerUser(firstName, lastName, email, password);
    sendSuccess(res, { message: 'Registration successful', userId: user.id }, 201);
  } catch (error) {
    sendError(res, error.message, 'BAD_REQUEST', 400);
  }
};

// Login an existing user
const login = async (req, res) => {
    try {
        const { email, password } = req.body; // Extract email and password from the request body

        const token = await authService.loginUser(email, password); // Attempt to log in the user using the authService
        sendSuccess(res, { message: 'Login successful', token }, 200); // Return a success message and the generated token upon successful login
    }
    catch (error) {
        sendError(res, error.message, 'BAD_REQUEST', 400); // Return a server error message if something goes wrong 
    }
};

module.exports =  { register, login }; // Export the register and login functions for use in other parts of the application
