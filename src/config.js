const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
module.exports = {
    port: process.env.PORT,
    apiKey: process.env.API_KEY,
    MAX_DIAS_API: 7,
    lat: process.env.LAT,
    lon: process.env.LON,
    serialPort: process.env.SERIAL_PORT,
    baudRate: parseInt(process.env.BAUD_RATE),
    paths: {
        historialCsv: 'data/historial.csv',
        climaJson: 'data/clima.json',
    }
};