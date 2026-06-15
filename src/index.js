const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth'); // Import the authentication routes
const walletRoutes = require('./routes/wallet');
dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes); // Use the authentication routes with the /api/auth prefix
app.use('/api/v1/wallet', walletRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok'});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});