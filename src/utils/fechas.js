// utils/fechas.js
const { MAX_DIAS_API } = require('../config');
const logger = require("../logger");

function getFechaLocalISO() {
    const ahora = new Date(); // obtenemos la fecha actual
     // formato 'YYYY-MM-DD HH:mm:ss'
    return ahora.toLocaleString('sv-SE', { // formato ISO
        timeZone: 'America/Bogota'
    }).split(' ')[0]; // lo convertimos a formato de fecha completa
}
function limiteFechas() {
    const ahora = new Date();
    // Obtener hora de Colombia (UTC-5) restando 5 horas a la hora UTC
    const colombiaTime = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
    // Redondear hacia abajo a la última hora completa
    colombiaTime.setMinutes(0, 0, 0); // elimina minutos, segundos y ms
    // Devolver en formato ISO tipo '2025-06-08T17:00:00Z'
    return colombiaTime.toISOString();
}

function obtenerRangoFechas(diasAtras = MAX_DIAS_API) {
    const hoy = new Date();
    const fechaFin = getFechaLocalISO(); // recibimos la hora actual
    hoy.setDate(hoy.getDate() - diasAtras); // le restamos los datos de la fecha actual
    const fechaInicio = hoy.toISOString().split("T")[0]; // obtenemos solo la fecha
    return { fechaInicio, fechaFin }; //retornamos los datos
}

function ajustarRango(fechaInicio, fechaFin) {
    const msInicio = new Date(fechaInicio).getTime();
    const msFin = new Date(fechaFin).getTime();
    const dias = (msFin - msInicio) / (1000 * 60 * 60 * 24);

    if (dias > MAX_DIAS_API) {
        logger.warn(`Rango excede el límite de ${MAX_DIAS_API} días (${dias.toFixed(1)} días detectados). Ajustando rango.`);
        return obtenerRangoFechas(MAX_DIAS_API);
    }
    return { fechaInicio, fechaFin };
}


module.exports = { obtenerRangoFechas, limiteFechas, ajustarRango };