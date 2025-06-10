const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const logger = require('../logger');

class SerialService {
    constructor(portPath, baudRate) {
        this.portPath = portPath;
        this.baudRate = baudRate;
        this.port = null;
        this.parser = null;
        this.active = false;
        this.buffer = [];
    }

    start() {
        this.port = new SerialPort({ path: this.portPath, baudRate: this.baudRate, autoOpen: true });
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.active = true;

        this.parser.on('data', line => {
            if (!this.active) return;
            try {
                const lectura = JSON.parse(line.trim());
                lectura.timestamp = new Date().toISOString();
                this.buffer.push(lectura);
            } catch (e) {
                logger.error('Parse error:', e.message);
            }
        });

        this.port.on('open', () => logger.info('Puerto serial abierto'));
        this.port.on('error', err => logger.error('Serial error:', err.message));
    }

    stop() {
        this.active = false;
        if (this.port && this.port.isOpen) {
            this.port.close(err => {
                if (err) logger.error('Error al cerrar puerto:', err.message);
                else logger.info('Puerto serial cerrado');
            });
        }
    }

    getBuffer() {
        return this.buffer;
    }
}

module.exports = new SerialService(process.env.SERIAL_PORT, Number(process.env.BAUD_RATE));
