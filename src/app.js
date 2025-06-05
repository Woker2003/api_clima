// Importamos los módulos necesarios
const express = require("express"); // Framework web
const { spawn } = require('child_process'); // Para ejecutar scripts de Python
const { obtenerRangoFechas } = require("./utils/fechas"); // Utilidad para obtener fechas
const { obtenerDatosClima, transformarDatos, getClimaActual } = require("./services/weatherService"); // Funciones del clima
const { guardarJSON, guardarLecturaCSV } = require("./utils/archivo");
const {readFileSync, existsSync} = require("node:fs");
const path = require('path');

const app = express();
app.use(express.json()); // Middleware para recibir JSON

const PUERTO = process.env.PORT || 3000; // Puerto por defecto
const CLAVE_API = process.env.API_KEY || '891e467b37d848fdb0d45350251105'; // API Key del clima
const LAT = "4.4136"; // Latitud de Roldanillo
const LON = "-76.1547"; // Longitud de Roldanillo

// Ruta principal para obtener datos del clima histórico y guardarlos
app.get("/search", async (req, res) => {
    try {
        // Obtenemos fechas de los últimos 3 días
        /*const { fechaInicio, fechaFin } = obtenerRangoFechas(7);

        // Llamamos a la API pública de clima con coordenadas y fechas
        const datosAPI = await obtenerDatosClima({
            lat: LAT,
            lon: LON,
            fechaInicio,
            fechaFin,
            apiKey: CLAVE_API,
        });

        // Transformamos los datos en lecturas útiles
        const lecturas = transformarDatos(datosAPI);

        // Estructuramos el resultado
        const resultado = {
            ciudad: datosAPI.location.name,
            region: datosAPI.location.region,
            pais: datosAPI.location.country,
            lecturas,
        };*/
        const data = readFileSync(path.join(__dirname, './data/clima.json'), 'utf-8');
        const resultado = JSON.parse(data);

        // Guardamos en archivo JSON y CSV localmente
        /*guardarJSON("clima.json", resultado);*/
        for (const lectura of resultado.lecturas) {
            const fecha = lectura.fecha;

            // Recorrer cada hora dentro del día
            for (const hora of lectura.horas) {
                // Llama a tu función para guardar en CSV con la fecha y la hora actual
                guardarLecturaCSV(fecha, hora);
            }
        }


        // Respondemos al cliente
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener datos del clima:", error.message);
        res.status(502).json({ error: "No se pudo obtener datos del clima" });
    }
});

// Ruta para predecir temperatura usando Random Forest
app.get('/prediccion', async (req, res) => {
    try {
        // Leer archivo JSON generado anteriormente
        const data = readFileSync(join(__dirname, './data/clima.json'), 'utf-8');
        const json = JSON.parse(data);

        // Tomar la última lectura
        const ultimaLectura = json.lecturas.at(-1); // o json.lecturas[json.lecturas.length - 1];

        // Extraer los datos requeridos por el modelo
        const datosModelo = {
            humedad: ultimaLectura.humedad,
            presion: ultimaLectura.presion,
            viento: ultimaLectura.viento,
            lluvia: ultimaLectura.lluvia || 0,
            nubes: ultimaLectura.nubes
        };

        // Ejecutamos el script de Python usando spawn
        const proceso = spawn('python', ['../ml/predecir.py']);

        let salida = ""; // Captura de la salida del script

        // Escuchamos los datos que imprime el script
        proceso.stdout.on('data', (data) => {
            salida += data.toString();
        });

        // Capturamos errores del script de Python
        proceso.stderr.on('data', (err) => {
            console.error('Error en Python:', err.toString());
        });

        // Cuando finaliza el proceso de Python
        proceso.on('close', () => {
            try {
                // Convertimos la salida JSON de Python en objeto JS
                const resultado = JSON.parse(salida);
                // Respondemos al cliente con la predicción
                res.json({
                    clima_actual: datosModelo,
                    temperatura_predicha: resultado.temperatura_predicha
                });
            } catch (e) {
                res.status(500).json({ error: 'Error procesando la predicción.' });
            }
        });

        // Enviamos los datos al script de Python por stdin
        proceso.stdin.write(JSON.stringify(datosModelo));
        proceso.stdin.end();

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'No se pudo obtener el clima actual' });
    }
});

app.get('/prediccion_lstm', async (req, res) => {
    try {
        // Ruta al archivo CSV con historial
        const csvPath = path.join(__dirname, 'data', 'historial.csv');
        if (!existsSync(csvPath)) {
            return res.status(404).json({ error: 'El archivo historial.csv no existe.' });
        }

        // Leer el CSV y extraer los últimos 7 días
        const contenido = readFileSync(csvPath, 'utf-8');
        const lineas = contenido.trim().split('\n');
        const encabezado = lineas[0].split(',');
        const ultimos7 = lineas.slice(-7);  // las últimas 7 filas

        // Convertir a formato JSON
        const datos = ultimos7.map(linea => {
            const valores = linea.split(',');
            const obj = {};
            encabezado.forEach((col, i) => {
                obj[col] = parseFloat(valores[i]);
            });
            return {
                temperatura: obj.temperatura,
                humedad: obj.humedad,
                presion: obj.presion,
                viento: obj.viento,
                lluvia: obj.lluvia,
                nubes: obj.nubes
            };
        });

        // Ejecutar script de predicción
        const proceso = spawn('python', ['../ml/predecir_lstm.py']);
        let salida = "";

        proceso.stdout.on('data', (data) => {
            try {
                const output = JSON.parse(data.toString());
                res.json(output);  // Enviar respuesta a cliente
            } catch (err) {
                console.error('❌ Error al procesar JSON:', err.message);
                res.status(500).json({ error: 'Error en la predicción LSTM' });
            }
        });
        proceso.stderr.on('data', err => console.error('❌ Error en Python:', err.toString()));

        proceso.on('close', () => {
            try {
                const resultado = JSON.parse(salida);
                res.json({
                    temperatura_predicha: resultado.temperatura_predicha
                });
            } catch (err) {
                console.error('❌ Error al procesar JSON:', err);
                res.status(500).json({ error: 'No se pudo interpretar la salida del modelo.' });
            }
        });

        // Enviar los últimos 7 días como entrada
        proceso.stdin.write(JSON.stringify(datos));
        proceso.stdin.end();

    } catch (err) {
        console.error("❌ Error en la predicción LSTM:", err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Iniciamos el servidor
app.listen(PUERTO, () => {
    console.log(`Servidor escuchando en el puerto ${PUERTO}`);
});
