const express = require('express');
const router = express.Router();
const { handleEmailForm } = require('../controllers/emailController');
const { emailLimiter } = require('../middlewares/rateLimiters');

router.post('/send', emailLimiter, handleEmailForm);

module.exports = router;
