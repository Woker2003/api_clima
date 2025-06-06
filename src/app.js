// app.js - Servidor principal para clima y Arduino

// ---------------------- MÓDULOS ----------------------
// Importamos librerías necesarias para servidor, sistema de archivos y comunicación serial
const express = require("express"); // Framework para crear servidor web
const path = require("path"); // Manipulación de rutas de archivos
const fs = require("fs"); // Sistema de archivos para leer/escribir archivos
const SerialPort = require("serialport"); // Comunicación con puerto serial (Arduino)
const ReadlineParser = require("@serialport/parser-readline"); // Parser para leer línea a línea el stream serial

// ---------------------- UTILIDADES Y SERVICIOS ----------------------
const { obtenerRangoFechas } = require("./utils/fechas"); // Función para obtener rango de fechas para consulta clima
const { obtenerDatosClima, transformarDatos } = require("./services/weatherService"); // API clima y transformación
const { guardarLecturaCSV, limpiarYOrdenarLecturas, agregarHorasUnicas } = require("./utils/archivo"); // Utilidades para manejo de archivos CSV y JSON

// ---------------------- CONFIGURACIONES ----------------------
const app = express(); // Crear instancia de Express
const PUERTO = process.env.PORT || 3000; // Puerto donde escucha el servidor
const CLAVE_API = process.env.API_KEY || "891e467b37d848fdb0d45350251105"; // API Key para consulta clima
const LAT = "4.4136"; // Latitud fija para ubicación
const LON = "-76.1547"; // Longitud fija para ubicación
const HISTORIAL_PATH = path.join(__dirname, "data", "historial.csv"); // Ruta archivo CSV historial
const CLIMA_JSON_PATH = path.join(__dirname, "data", "clima.json"); // Ruta archivo JSON principal con datos combinados

// ---------------------- CONFIGURACIÓN SERIAL ----------------------
// Variables para manejar puerto serial
let port = null; // Puerto serial (Arduino)
let parser = null; // Parser para leer línea a línea
let puertoDisponible = false; // Estado si puerto está abierto

// ---------------------- MIDDLEWARE ----------------------
app.use(express.json()); // Middleware para parsear JSON en requests
app.use(express.static(path.join(__dirname, "public"))); // Servir archivos estáticos desde carpeta "public"

// ---------------------- VARIABLES DE ESTADO ----------------------
let lecturaActiva = false; // Control para saber si estamos leyendo datos en tiempo real
let bufferLecturas = []; // Buffer temporal donde se almacenan lecturas recibidas desde Arduino
let horaInicio = null; // Momento en que se inicia la lectura (para orden y agrupamiento)
let ultimaLectura = null; // Guardar última lectura recibida para consulta rápida

// ---------------------- LECTURA DESDE ARDUINO ----------------------
try {
    port = new SerialPort({
        path: "COM4", // Cambiar a puerto correcto según sistema
        baudRate: 9600, // Velocidad estándar Arduino
        autoOpen: true, // Abrir puerto al crear instancia
    });

    // Crear parser para dividir flujo serial por líneas
    parser = port.pipe(new ReadlineParser({ delimiter: "\n" })); // cada vez que haya un salto de linea para

    puertoDisponible = true;

    // Evento cuando puerto abre correctamente
    port.on("open", () => {
        console.log("Puerto serial abierto correctamente");
    });

    // Evento cuando llega nueva línea desde Arduino
    parser.on("data", (data) => {
        if (!lecturaActiva) return; // Ignorar datos si no estamos en modo lectura activa
    //tengo que presionar leer para que lea los datos haciendo una confirmacion de lectura
        try {
            // Parsear JSON recibido (esperamos que Arduino envíe JSON válido por línea)
            const lectura = JSON.parse(data.trim());
            lectura.timestamp = new Date().toISOString(); // Añadir timestamp actual

            bufferLecturas.push(lectura); // Guardar lectura en buffer temporal
            ultimaLectura = lectura; // Actualizar última lectura para consulta rápida

            console.log("Lectura recibida:", lectura);
        } catch (err) {
            console.error("Error procesando dato:", err.message); // Captura errores de parseo JSON
        }
    });

    // Evento error en puerto serial
    port.on("error", (err) => {
        console.error("Error en el puerto serial:", err.message);
    });
} catch (err) {
    // En caso de fallo al abrir puerto (Arduino desconectado o puerto incorrecto)
    console.warn("Arduino no conectado o puerto COM inválido. El sistema seguirá funcionando sin datos seriales.");
    port = null;
    parser = null;
    puertoDisponible = false;
}

// ---------------------- RUTAS ----------------------

// Ruta GET para obtener datos históricos desde API externa y guardar en archivo JSON y CSV
app.get("/search", async (req, res) => {
    try {
        const ahora = new Date();

        // ---------------------------
        // 1. Leer datos existentes del archivo JSON (si existe)
        // ---------------------------
        let datosExistentes = { lecturas: [] };
        if (fs.existsSync(CLIMA_JSON_PATH)) {
            const contenido = fs.readFileSync(CLIMA_JSON_PATH, "utf-8");
            if (contenido.trim()) datosExistentes = JSON.parse(contenido);
        }

        // ---------------------------
        // 2. Validar si ya tenemos datos actualizados hasta hoy
        // ---------------------------
        function mismaFechaSinHora(f1, f2) {
            return f1.getFullYear() === f2.getFullYear() &&
                f1.getMonth() === f2.getMonth() &&
                f1.getDate() === f2.getDate();
        }
        if (datosExistentes.lecturas.length > 0) {
            const fechas = datosExistentes.lecturas.map(d => new Date(d.fecha));
            const fechaMaxima = new Date(Math.max(...fechas));
            const hoy = new Date();

            if (fechaMaxima > hoy || mismaFechaSinHora(fechaMaxima, hoy)) {
                return res.json({
                    mensaje: "Datos ya actualizados hasta hoy",
                    lecturas: datosExistentes.lecturas,
                });
            }
        }

        // ---------------------------
        // 3. Si no tenemos datos actualizados, calculamos rango de fechas para la consulta
        // ---------------------------
        let fechaInicio, fechaFin;

        // Si hay datos previos, vamos a empezar la consulta desde el día siguiente al último dato guardado
        if (datosExistentes && datosExistentes.lecturas.length > 0) {
            const fechasLecturas = datosExistentes.lecturas.map(l => new Date(l.fecha));
            const fechaMaxima = new Date(Math.max(...fechasLecturas));

            // La fecha de inicio será un día después de la última fecha guardada
            fechaInicio = new Date(fechaMaxima);
            fechaInicio.setDate(fechaInicio.getDate() + 1);

            // La fecha fin será hoy
            fechaFin = ahora;

            // Si la fechaInicio es mayor que la fecha fin, la ajustamos para no pedir datos innecesarios
            if (fechaInicio > fechaFin) {
                fechaInicio = new Date(fechaFin);
            }
        } else {
            // Si no hay datos guardados, tomamos los últimos 7 días por defecto
            const rango = obtenerRangoFechas(7);
            fechaInicio = new Date(rango.fechaInicio);
            fechaFin = new Date(rango.fechaFin);
        }

        // Formatear fechas a ISO (yyyy-mm-dd) para la consulta a la API
        const fechaInicioISO = fechaInicio.toISOString().split("T")[0];
        const fechaFinISO = fechaFin.toISOString().split("T")[0];

        // ---------------------------
        // 4. Consultar la API externa para obtener datos climáticos
        // ---------------------------
        const datosAPI = await obtenerDatosClima({
            lat: LAT,
            lon: LON,
            fechaInicio: fechaInicioISO,
            fechaFin: fechaFinISO,
            apiKey: CLAVE_API,
        });

        // Transformar los datos para tener solo lo necesario
        const lecturasNuevas = transformarDatos(datosAPI);

        // Construimos objeto encabezado para enviar info de ciudad junto con lecturas
        const encabezado = {
            ciudad: datosAPI.location.name,
            region: datosAPI.location.region,
            pais: datosAPI.location.country,
        };

        // Si no teníamos datos previos, inicializamos la estructura
        if (!datosExistentes) {
            datosExistentes = { ...encabezado, lecturas: [] };
        }

        // Filtrar horas para no incluir horas futuras respecto a 'ahora'
        const lecturasFiltradas = lecturasNuevas
            .map(dia => {
                // Filtramos las horas válidas que no estén en el futuro
                const horasFiltradas = (dia.horas || []).filter(hora => {
                    if (!hora.hora) return false;
                    // Creamos un Date con la fecha y hora para comparar
                    const fechaCompleta = new Date(`${dia.fecha}T${hora.hora}:00`);
                    return !isNaN(fechaCompleta.getTime()) && fechaCompleta.getTime() <= ahora.getTime();
                });
                return { ...dia, horas: horasFiltradas };
            })
            .filter(dia => dia.horas.length > 0); // Eliminamos días sin horas válidas

        // Guardar cada lectura en CSV para persistencia local
        lecturasFiltradas.forEach(dia => {
            dia.horas.forEach(hora => guardarLecturaCSV(dia.fecha, hora));
        });

        // Integrar lecturas nuevas con las existentes
        lecturasFiltradas.forEach(nuevoDia => {
            const diaExistente = datosExistentes.lecturas.find(d => d.fecha === nuevoDia.fecha);
            if (diaExistente) {
                agregarHorasUnicas(diaExistente, nuevoDia.horas);
            } else {
                datosExistentes.lecturas.push(nuevoDia);
            }
        });

        // Limpiar duplicados y ordenar las lecturas para mantener orden correcto
        datosExistentes = limpiarYOrdenarLecturas(datosExistentes);

        // Guardar JSON actualizado en disco
        fs.writeFileSync(CLIMA_JSON_PATH, JSON.stringify(datosExistentes, null, 2));

        // ---------------------------
        // 5. Responder con datos combinados (existentes + nuevos)
        // ---------------------------
        res.json({ ...encabezado, lecturas: datosExistentes.lecturas });

    } catch (error) {
        console.error("Error al obtener datos del clima:", error.message);
        res.status(502).json({ error: "No se pudo obtener datos del clima" });
    }
});

// ---------------------- RUTAS PARA LECTURAS EN VIVO ----------------------

// GET: Obtener última lectura recibida desde Arduino (buffer en memoria)
app.get("/lecturas/arduino", (req, res) => {
    if (!lecturaActiva || bufferLecturas.length === 0) {
        // No hay lecturas en tiempo real si no está activa la lectura o buffer está vacío
        return res.status(404).json({ error: "No hay lecturas en tiempo real" });
    }

    const ultima = bufferLecturas.at(-1); // Última lectura recibida
    res.json({ lectura_actual: ultima });
});

// POST: Iniciar lectura en tiempo real desde Arduino
app.post("/lecturas/iniciar", (req, res) => {
    lecturaActiva = true; // Activar flag de lectura
    bufferLecturas = []; // Limpiar buffer de lecturas anteriores
    horaInicio = new Date(); // Marcar hora de inicio de lectura
    res.json({ mensaje: "Lectura desde Arduino iniciada" });
});

// POST: Detener lectura en tiempo real, procesar datos y guardar promedios por hora
app.post("/lecturas/detener", (req, res) => {
    if (!lecturaActiva) {
        // Si ya estaba detenida, solo confirmamos
        return res.json({ mensaje: "La lectura ya estaba detenida, no hay datos para guardar." });
    }

    lecturaActiva = false; // Desactivar lectura

    if (bufferLecturas.length === 0) {
        // No hay datos para procesar
        return res.json({ mensaje: "Lectura detenida. No había datos para procesar." });
    }

    const ahora = new Date();

    // Filtrar lecturas con timestamp válido hasta momento actual
    const bufferFiltrado = bufferLecturas.filter(l => new Date(l.timestamp) <= ahora);

    const lecturasPorHora = {}; // Objeto para agrupar lecturas por hora (ISO string)

    // Agrupar lecturas por hora, redondeando minutos a 00
    bufferFiltrado.forEach(lectura => {
        const fecha = new Date(lectura.timestamp);
        fecha.setMinutes(0, 0, 0); // Redondear a inicio de hora
        const claveHora = fecha.toISOString();

        if (!lecturasPorHora[claveHora]) lecturasPorHora[claveHora] = [];
        lecturasPorHora[claveHora].push(lectura);
    });

    // Leer datos existentes para combinar con nuevos
    let datosExistentes = { lecturas: [] };
    if (fs.existsSync(CLIMA_JSON_PATH)) {
        const contenido = fs.readFileSync(CLIMA_JSON_PATH, "utf-8");
        datosExistentes = JSON.parse(contenido);
    }

    const nuevasLecturas = []; // Aquí guardaremos lecturas promediadas

    // Calcular promedio de cada grupo por hora
    for (const hora in lecturasPorHora) {
        const grupo = lecturasPorHora[hora];

        // Reducir sumando cada propiedad numérica
        const suma = grupo.reduce((acc, curr) => {
            acc.temperatura += curr.temperatura ?? 0;
            acc.humedad += curr.humedad ?? 0;
            acc.presion += curr.presion ?? 0;
            acc.viento += curr.viento ?? 0;
            acc.lluvia += curr.lluvia ?? 0;
            return acc;
        }, { temperatura: 0, humedad: 0, presion: 0, viento: 0, lluvia: 0 });

        const n = grupo.length;

        // Crear objeto con valores promedios redondeados a 2 decimales
        const lecturaPromediada = {
            temperatura: +(suma.temperatura / n).toFixed(2),
            humedad: +(suma.humedad / n).toFixed(2),
            presion: +(suma.presion / n).toFixed(2),
            viento: +(suma.viento / n).toFixed(2),
            lluvia: +(suma.lluvia / n).toFixed(2),
            fecha: hora.split("T")[0],
            hora: hora.slice(11, 16), // Extraemos HH:mm
        };

        nuevasLecturas.push(lecturaPromediada);
    }

    // Agregar nuevas lecturas al historial existente, agrupando por fecha y hora
    nuevasLecturas.forEach(nueva => {
        let dia = datosExistentes.lecturas.find(d => d.fecha === nueva.fecha);
        if (!dia) {
            dia = { fecha: nueva.fecha, horas: [] };
            datosExistentes.lecturas.push(dia);
        }
        // Buscar si ya existe hora para reemplazar (actualizar)
        const idxHora = dia.horas.findIndex(h => h.hora === nueva.hora);
        if (idxHora >= 0) {
            dia.horas[idxHora] = nueva; // Reemplazar si existe
        } else {
            dia.horas.push(nueva); // Agregar nueva hora
        }
    });

    // Ordenar lecturas por fecha y hora para mantener orden cronológico
    datosExistentes = limpiarYOrdenarLecturas(datosExistentes);

    // Guardar datos actualizados en archivo JSON
    fs.writeFileSync(CLIMA_JSON_PATH, JSON.stringify(datosExistentes, null, 2));

    // Guardar nuevas lecturas en CSV
    nuevasLecturas.forEach(({ fecha, hora, ...resto }) => guardarLecturaCSV(fecha, { hora, ...resto }));

    // Limpiar buffer y resetear horaInicio
    bufferLecturas = [];
    horaInicio = null;

    res.json({ mensaje: "Lectura detenida y datos guardados", nuevas_lecturas: nuevasLecturas });
});

// ---------------------- RUTA PARA OBTENER ÚLTIMA LECTURA ACTUAL ----------------------
app.get("/lecturas/actual", (req, res) => {
    if (!ultimaLectura) {
        return res.status(404).json({ error: "No hay lectura actual disponible" });
    }
    res.json(ultimaLectura);
});

// ---------------------- INICIAR SERVIDOR ----------------------
app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});