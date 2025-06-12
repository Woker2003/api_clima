/**
 * Archivo principal del servidor
 * Inicializa Express, configura rutas y servicios
 * Gestiona la conexión serial con Arduino y permite consultar datos de clima
 */

// Carga de dependencias y configuración del servidor
const express = require('express'); // Framework para crear el servidor web y gestionar rutas
const path = require('path'); // Módulo nativo de Node.js para manejar rutas de archivos
const logger = require('./logger'); // Sistema de logs personalizado para registrar eventos y errores
const config = require('./config'); // Archivo de configuración con variables globales obtenidad de .env

// Importación de servicios y controladores
const serialService = require('./services/serialService'); // Servicio para gestionar la conexión serial con Arduino
const { search } = require('./controllers/weatherController');  // Controlador para consultar y almacenar datos de clima desde una API externa
const { detenerLectura } = require('./controllers/lecturasController');

const app = express(); // Inicializa una nueva aplicación de Express
app.use(express.json()); // Middleware que permite recibir y procesar datos JSON en las peticiones
app.use(express.static(path.join(__dirname, 'public'))); // Sirve archivos estáticos (HTML, CSS, JS) desde la carpeta 'public'

// Rutas de la API
app.get('/search', search); // Ruta que consulta datos climáticos de la API, los guarda y responde con resultados paginados

app.post('/lecturas/iniciar', (req, res) => {
    // Ruta para iniciar la lectura serial desde Arduino
    serialService.start(); // Abre el puerto serial y empieza a recibir datos
    res.json({ mensaje: 'Lectura serial iniciada' }); // Confirma al cliente que se inició correctamente
});

// Ruta que devuelve la última lectura recibida desde Arduino
app.get('/lecturas/arduino', (req, res) => {
    const last = serialService.getLast(); // Obtiene la última lectura almacenada en memoria
    if (!last) return res.status(404).json({ error: 'No hay lecturas en tiempo real' }); // Si no hay datos, responde con error
    res.json({ lectura_actual: last }); // Devuelve la lectura más reciente
});

// Ruta para detener la lectura serial desde Arduino
app.post('/lecturas/detener', detenerLectura);

// Inicia el servidor y lo pone a escuchar en el puerto configurado
app.listen(config.port, () => {
    logger.info(`Servidor corriendo en http://localhost:${config.port}`); // Mensaje de confirmación en consola/logs
});
