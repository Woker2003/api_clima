const fs = require("fs");
const path = require("path");

// Rutas a los archivos de datos
const csvPath = path.join(__dirname, "..", "data", "historial.csv");
const jsonPath = path.join(__dirname, "..", "data", "clima.json");

/**
 * Guarda una lectura en formato CSV, creando encabezado si no existe.
 * @param {string} fecha - Fecha de la lectura (YYYY-MM-DD).
 * @param {object} data - Objeto con propiedades hora,temp,humedad,presionMb,vientoKph,lluvia,nubes.
 */
function guardarLecturaCSV(fecha, data) {
    const linea = `${fecha},${data.hora},${data.temp},${data.humedad},${data.presionMb},${data.vientoKph},${data.lluvia},${data.nubes}\n`;
    const encabezado = "fecha,hora,temperatura,humedad,presion,viento,lluvia,nubes\n";

    if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, encabezado);
    }

    fs.appendFileSync(csvPath, linea);
}

/**
 * Elimina duplicados y ordena un objeto con estructura.
 * - Ordena días de forma ascendente.
 * - Quita días duplicados (misma fecha) en O(n) con un Set.
 * - Para cada día, quita horas duplicadas y ordena por hora.
 * @param {object} datos - Objeto con propiedad `lecturas`.
 * @returns {object} - Mismo objeto con `lecturas` limpio y ordenado.
 */
function limpiarYOrdenarLecturas(datos) {
    // 1. Ordenamos días por fecha (ascendente)
    datos.lecturas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // 2. Eliminamos días duplicados usando un Set
    const seenDates = new Set();
    datos.lecturas = datos.lecturas.filter(d => {
        if (seenDates.has(d.fecha)) return false;
        seenDates.add(d.fecha);
        return true;
    });

    // 3. Para cada día, eliminamos horas duplicadas y ordenamos
    datos.lecturas.forEach(d => {
        const seenHours = new Set();
        d.horas = (d.horas || []).filter(h => {
            if (seenHours.has(h.hora)) return false;
            seenHours.add(h.hora);
            return true;
        });
        d.horas.sort((h1, h2) => h1.hora.localeCompare(h2.hora));
    });

    return datos;
}

/**
 * Agrupa un array de lecturas (con timestamp ISO) en un Map donde cada clave
 * es el inicio de hora (YYYY-MM-DDTHH:00:00.000Z) y el valor es el array de lecturas.
 * @param {Array} buffer - Array de lecturas con propiedad `timestamp`.
 * @returns {Map<string, Array>} - Mapa de lecturas agrupadas por hora.
 */
function agruparPorHora(buffer) {
    const map = new Map();
    buffer.forEach(reading => {
        const dt = new Date(reading.timestamp);
        dt.setMinutes(0, 0, 0);
        const key = dt.toISOString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(reading);
    });
    return map;
}

module.exports = {
    guardarLecturaCSV,
    limpiarYOrdenarLecturas,
    agruparPorHora,
    jsonPath
};
