const rateLimit = require('express-rate-limit');

// Limita o envio de e-mails: 5 requisições por IP a cada 15 minutos
exports.emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errors: ['Muitas tentativas. Tente novamente em alguns minutos.']
    }
});
