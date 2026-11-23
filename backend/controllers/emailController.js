const { validateFormData } = require('../validators/emailValidators');
const { sendEmail } = require('../services/emailServices');

exports.handleEmailForm = async (req, res) => {
    const { nome, email, mensagem } = req.body || {};
    const data = {
        nome: typeof nome === 'string' ? nome.trim() : '',
        email: typeof email === 'string' ? email.trim() : '',
        mensagem: typeof mensagem === 'string' ? mensagem.trim() : ''
    };

    const errors = validateFormData(data);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    try {
        await sendEmail(data);
        return res.status(200).json({
            success: true,
            message: 'E-mail enviado com sucesso!'
        });
    } catch (err) {
        console.error('Erro ao enviar e-mail:', err);
        return res.status(500).json({
            success: false,
            message: 'Erro ao enviar e-mail. Tente novamente mais tarde.'
        });
    }
};
