const authService = require('../services/authService');


// Register a new user
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const user = await authService.registerUser(firstName, lastName, email, password);
    res.status(201).json({ message: 'Registration successful', userId: user.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login an existing user
const login = async (req, res) => {
    try {
        const { email, password } = req.body; // Extract email and password from the request body

        const token = await authService.loginUser(email, password); // Attempt to log in the user using the authService
        res.json({ message: 'Login successful', token }); // Return a success message and the generated token upon successful login
    }
    catch (error) {
        res.status(400).json({ message: error.message }); // Return a server error message if something goes wrong 
    }
};

module.exports =  { register, login }; // Export the register and login functions for use in other parts of the application
