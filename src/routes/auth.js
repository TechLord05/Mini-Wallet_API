const express = require ('express');
const router = express.Router(); // express's built-in router to define routes for authentication
const { register, login } = require('../controllers/auth'); // Import the register and login functions from the auth controller

// Define the route for user registration
router.post('/register', register); // POST /api/auth/register
router.post('/login', login); // POST /api/auth/login

module.exports = router; // Export the router to be used in the main application file (app.js)