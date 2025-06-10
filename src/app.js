                // Carga variables de .env
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs').promises;
const logger = require('./logger');
const config = require('./config');

// Servicios y controladores
const serialService = require('./services/serialService');
const { search } = require('./controllers/weatherController');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/search', search);

app.get('/lecturas/arduino', (req, res) => {
    const last = serialService.getLast();
    if (!last) return res.status(404).json({ error: 'No hay lecturas en tiempo real' });
    res.json({ lectura_actual: last });
});

app.post('/lecturas/iniciar', (req, res) => {
    serialService.start();
    res.json({ mensaje: 'Lectura serial iniciada' });
});

app.post('/lecturas/detener', async (req, res) => {
    serialService.stop();
    const buffer = serialService.getBuffer();
    // Aquí procesar buffer, calcular promedios y guardar...
    res.json({ mensaje: 'Lectura detenida', total: buffer.length });
});

// Iniciar servidor
app.listen(config.port, () => {
    logger.info(`Servidor corriendo en http://localhost:${config.port}`);
});