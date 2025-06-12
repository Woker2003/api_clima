const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const rutaArchivo = path.join(__dirname, '../data/clima.json');// Ruta al archivo donde se almacenan las lecturas

/**
 * Agrupa un array de lecturas por hora exacta (formato ISO: YYYY-MM-DDTHH:00).
 */
function agruparPorHora(lecturas) {
    const agrupadas = {};
    lecturas.forEach(({ timestamp, ...resto }) => {
        const fecha = new Date(timestamp);
        const claveHora = fecha.toISOString().slice(0, 13) + ':00'; // YYYY-MM-DDTHH:00
        if (!agrupadas[claveHora]) agrupadas[claveHora] = [];
        agrupadas[claveHora].push({ timestamp, ...resto });
    });
    return agrupadas;
}

/**
 * Calcula promedios numéricos de un grupo de lecturas.
 */
function calcularPromedios(lecturas) {
    if (!lecturas || lecturas.length === 0) return {};

    // Inicializar suma de campos dinámicamente con las claves del primer objeto
    const camposNumericos = ['temperatura', 'humedad', 'presion', 'viento', 'lluvia'];
    const acumulado = {};

    for (const campo of camposNumericos) {
        acumulado[campo] = 0;
    }

    // Sumar todos los valores por campo
    for (const lectura of lecturas) {
        for (const campo of camposNumericos) {
            acumulado[campo] += lectura[campo] || 0; // Si falta algún campo, suma 0
        }
    }

    // Dividir para sacar promedio y redondear
    const promedio = {};
    for (const campo of camposNumericos) {
        promedio[campo] = +(acumulado[campo] / lecturas.length).toFixed(2);
    }
    return promedio;
}

/**
 * Guarda lecturas agrupadas por hora en el archivo JSON.
 * - Crea el archivo si no existe.
 * - Agrupa por hora, calcula promedios.
 * - Inserta o actualiza lecturas (promediando si ya existe).
 */
function guardarLecturasAgrupadas(lecturas) {
    if (!fs.existsSync(rutaArchivo)) {// Asegurar existencia del archivo
        fs.writeFileSync(rutaArchivo, JSON.stringify({ lecturas: [] }, null, 2));
    }

    let datos;// Cargar archivo existente
    try {
        const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
        datos = contenido.trim() ? JSON.parse(contenido) : { lecturas: [] };
    } catch (err) {
        logger.error('Error leyendo clima.json, usando estructura vacía');
        datos = { lecturas: [] };
    }

    // Procesar lecturas recibidas
    const agrupadas = agruparPorHora(lecturas);

    for (const fechaHora in agrupadas) {
        const [fecha] = fechaHora.split('T');
        const promedio = calcularPromedios(agrupadas[fechaHora]);

        // Buscar el día en el archivo
        let dia = datos.lecturas.find(d => d.fecha === fecha);
        if (!dia) {
            dia = { fecha, horas: [] };
            datos.lecturas.push(dia);
        }

        // Verificar si ya existe esa hora
        let entrada = dia.horas.find(h => h.fechaHora === fechaHora);

        if (entrada) {
            // Actualizar con nuevo promedio (combinado con el existente)
            for (const key of ['temperatura', 'humedad', 'presion', 'viento', 'lluvia']) {
                entrada[key] = +((entrada[key] + promedio[key]) / 2).toFixed(2);
            }
            entrada.lectura = true;
        } else {
            // Insertar como nueva entrada
            dia.horas.push({
                fechaHora,
                ...promedio,
                lectura: true
            });
        }
    }

    // Guardar archivo actualizado
    fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2), 'utf-8');
    logger.info('Lecturas agrupadas guardadas correctamente');
}

module.exports = {
    guardarLecturasAgrupadas
};
