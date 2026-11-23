const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const projetosRoutes = require('./routes/projectRoutes');

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGINS ||
    'https://lucasaguiar.online,https://www.lucasaguiar.online')
    .split(',')
    .map((o) => o.trim());

if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:4000', 'http://localhost:3000');
}

app.use(cors({ origin: allowedOrigins }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/projetos', projetosRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date()
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
