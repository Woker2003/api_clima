const { SerialPort } = require('serialport');// Importamos la clase SerialPort para comunicar con Arduino por puerto serial
const { ReadlineParser } = require('@serialport/parser-readline');// Importamos el parser que separa los datos por línea ('\n')
const logger = require('../logger');// Logger personalizado para mostrar mensajes informativos o errores

// Clase que gestiona la conexión y lectura desde el puerto serial
class SerialService {
    /**
     * Constructor de la clase
     * @param {string} portPath - Ruta del puerto serial (ej: 'COM3' o '/dev/ttyUSB0')
     * @param {number} baudRate - Velocidad de comunicación (debe coincidir con Arduino)
     */
    constructor(portPath, baudRate) {
        this.portPath = portPath;     // Ruta al puerto
        this.baudRate = baudRate;     // Baud rate de comunicación
        this.port = null;             // Objeto SerialPort (se asigna al iniciar)
        this.parser = null;           // Parser de texto entrante (se asigna al iniciar)
        this.active = false;          // Bandera para saber si está leyendo
        this.buffer = [];             // Buffer con todas las lecturas recibidas
    }

    /**
     * Inicia la conexión y comienza a escuchar datos desde Arduino
     */
    start() {
        // Crear y abrir el puerto serial
        this.port = new SerialPort({
            path: this.portPath,
            baudRate: this.baudRate,
            autoOpen: true
        });

        // Crear parser que separa los datos por salto de línea ('\n')
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.active = true; // activamos mostrando que desde html estamos escuchando a arduino

        // Evento cuando llega una línea de datos desde Arduino
        this.parser.on('data', line => {
            if (!this.active) return; // Si no está activo, ignorar la lectura

            try {
                const lectura = JSON.parse(line.trim());// Intentar convertir la línea recibida (string) en un objeto JSON

                lectura.timestamp = new Date().toISOString();// Agregar timestamp actual en formato ISO para las lecturas

                // Guardar en el buffer
                this.buffer.push(lectura);
            } catch (e) {
                // Si falla el parseo, mostrar error
                logger.error('Parse error:', e.message);
            }
        });

        // Mostrar mensaje cuando el puerto se abre correctamente
        this.port.on('open', () => logger.info('Puerto serial abierto'));

        // Manejo de errores en el puerto
        this.port.on('error', err =>
            logger.error('Serial error:', err.message)
        );
    }

    /**
     * Detiene la lectura y cierra el puerto serial si está abierto
     */
    stop() {
        this.active = false;

        if (this.port && this.port.isOpen) {
            this.port.close(err => {
                if (err) logger.error('Error al cerrar puerto:', err.message);
                else logger.info('Puerto serial cerrado');
            });
        }
    }

    /**
     * Devuelve todas las lecturas recibidas hasta el momento
     * @returns {Array<Object>} Array de objetos con datos del sensor
     */
    getBuffer() {
        return this.buffer;
    }

    /**
     * Devuelve la última lectura disponible (útil para mostrar en tiempo real)
     * @returns {Object|null} Último objeto de lectura o null si no hay datos
     */
    getLast() {
        return this.buffer.length > 0
            ? this.buffer[this.buffer.length - 1]
            : null;
    }
}

// Exportamos una instancia de SerialService ya configurada
module.exports = new SerialService(
    process.env.SERIAL_PORT,  // Ruta al puerto, leída de variables de entorno
    Number(process.env.BAUD_RATE) // Baud rate, convertido a número
);
