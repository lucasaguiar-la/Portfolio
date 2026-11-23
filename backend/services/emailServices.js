const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

// Remove quebras de linha para evitar injeção de cabeçalhos
const singleLine = (value) => String(value).replace(/[\r\n]+/g, ' ');

exports.sendEmail = async ({ nome, email, mensagem }) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        replyTo: singleLine(email),
        to: process.env.EMAIL_USER,
        subject: `[PORTFÓLIO] - Nova mensagem de ${singleLine(nome)}!`,
        text: `Nome: ${nome}\nEmail: ${email}\n\nMensagem:\n${mensagem}`,
        html: `
            <h2>Nova mensagem do portfólio</h2>
            <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Mensagem:</strong></p>
            <p style="white-space: pre-wrap;">${escapeHtml(mensagem)}</p>
        `
    };

    await transporter.sendMail(mailOptions);
}