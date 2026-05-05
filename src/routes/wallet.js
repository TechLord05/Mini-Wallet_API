const express = require('express');
const router = express.Router();
const { getBalance, initializePayment, handleWebhook, transfer } = require('../controllers/wallet');
const authenticate = require('../middleware/auth')

router.get('/balance', authenticate, getBalance);
router.post('/fund/initialize', authenticate, initializePayment);
router.post('/webhook', handleWebhook);
router.post('/transfer', authenticate, transfer);


module.exports = router;