// src/controllers/weatherController.js
const fs = require('fs').promises;
const config = require('../config');
const logger = require('../logger');
const { obtenerRangoFechas, limiteFechas, ajustarRango } = require('../utils/fechas');
const { obtenerDatosClima, transformarDatos } = require('../services/weatherService');
const {limpiarYOrdenarLecturas,guardarLecturaCSV} = require('../services/archivoService');

async function search(req, res) {
    try {
        // 1. Leer JSON existente
        let datos = { lecturas: [] }; // creamos la estructura inicial del json
        try {
            const contenido = await fs.readFile(config.paths.climaJson, 'utf-8');
            datos = contenido.trim() ? JSON.parse(contenido) : datos; // validamos que no este vacio
        } catch {
            logger.warn('No existe clima.json, se creará uno nuevo.'); // guardamos logs
        }

        // 2. Calcular rango de fechas para la consulta
        let fechaInicio, fechaFin, ultimaId; // creamos variables iniciales
        if (datos.lecturas.length > 0) { // si los datos que obtengo del archivo esta vacio
            const { maxFechaMs, maxId } = datos.lecturas.reduce((acc, lectura) => { // obtenemos dos datos del codigo que voy a ejecutar
                // reduce crea un acumulador y lee todo el objeto
                const fechaMs = new Date(lectura.fecha).getTime(); // obtenemos la fecha en ms para comparar con Math.max
                acc.maxFechaMs = Math.max(acc.maxFechaMs, fechaMs); // guardamos la fecha mas grande
                acc.maxId = Math.max(acc.maxId, lectura.id ?? 0); // guardamos el ultimo id
                return acc; // retornamos el objeto para tener acceso a sus datos
            }, { maxFechaMs: 0, maxId: 0 }); // le doy un valor por default

            const ultima = new Date(maxFechaMs); // convertimos la ultima fecha de ms a fecha normal
            // le pasamos el rango de fecha que obtuvimos, la mas vieja y la actual
            fechaInicio = ultima.toISOString().split('T')[0];
            fechaFin = new Date().toISOString().split('T')[0];

            ({ fechaInicio, fechaFin } = ajustarRango(fechaInicio, fechaFin));
            ultimaId = maxId;
        } else {
            // si el objeto esta vacio obtenemos el rango de fechas de los ultimos 7 dias
            ({ fechaInicio, fechaFin } = obtenerRangoFechas(7));
            ultimaId = 0;
        }

        // 3. Llamar a la API y transformar
        const datosAPI = await obtenerDatosClima({
            lat: config.lat,
            lon: config.lon,
            fechaInicio,
            fechaFin,
            apiKey: config.apiKey
        });// pedimos los datos a la api mandandole los parametros
        const nuevas = transformarDatos(datosAPI, ultimaId + 1);// los datos que recibimos los transformamos y le mandamos una id establecida
        const fechaHoraLimiteUTC = limiteFechas(); // almacenamos la fecha actual en colombia

        // Filtrar las lecturas que ocurren después de la hora límite
        const nuevasFiltradas = nuevas.map(dia => { // leemos los datos transformados y guardamos las lecturas hasta la hora y fecha actual
            const horasFiltradas = dia.horas.filter(h => {
                const fechaHoraStr = `${dia.fecha}T${h.hora}:00Z`; // formato UTC completo
                return new Date(fechaHoraStr) <= new Date(fechaHoraLimiteUTC);
            });
            return { ...dia, horas: horasFiltradas };
        }).filter(dia => dia.horas.length > 0); // eliminar días vacíos

        // 4. Combinar días nuevos con los existentes
        nuevasFiltradas.forEach(nuevoDia => {
            //comprobamos que no hayan datos repetidos y agregamos los nuevos
            const existe = datos.lecturas.find(d => d.fecha === nuevoDia.fecha); // revisa todas las fechas
            if (existe) {
                // Agregar horas únicas
                nuevoDia.horas.forEach(hora => { // Va a comparar cada hora del nuevo día con las que ya hay.
                    if (!existe.horas.find(h => h.hora === hora.hora)) {
                        existe.horas.push(hora);//Si esa hora aún no está registrada, la agrega
                    }
                });
            } else {
                datos.lecturas.push(nuevoDia); // agrega toda la lectura
            }
        });

        // 5. Limpiar duplicados y ordenar
        datos = limpiarYOrdenarLecturas(datos);

        // 7. Guardar JSON actualizado con encabezado
        await fs.writeFile(config.paths.climaJson, JSON.stringify(datos, null, 2));

        // 8. Persistir lecturas en CSV
        datos.lecturas.forEach(dia => dia.horas.forEach(hora => guardarLecturaCSV(dia.fecha, hora)));

        // 9. Paginación por día
        const page = parseInt(req.query.page) || 1;
        const limit = 1; // solo 1 día por página
        const total = datos.lecturas.length; // tamaño de los objetos
        const pages = Math.ceil(total / limit); //
        const startIndex = (page - 1) * limit;
        const lecturasPaginadas = datos.lecturas.slice(startIndex, startIndex + limit);

        // 10. Responder
        res.json({
            ciudad: datosAPI.location.name,
            region: datosAPI.location.region,
            pais: datosAPI.location.country,
            lecturas: lecturasPaginadas,
            page,
            pages,
            total
        }); // le pasamos los datos paginados a la vista
    } catch (err) {
        logger.error(`search error: ${err.message}\n${err.stack}`); // guardamos el error en los logs
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = { search };
