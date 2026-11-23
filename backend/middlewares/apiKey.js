const crypto = require('crypto');

// Protege rotas administrativas com a chave ADMIN_API_KEY (header x-api-key).
// Sem a variável configurada, a rota fica desabilitada.
module.exports = (req, res, next) => {
    const expected = process.env.ADMIN_API_KEY;
    const provided = req.get('x-api-key');

    if (!expected || !provided) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};
