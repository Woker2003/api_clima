// app.js
const express = require("express");
require('dotenv').config();
const { obtenerRangoFechas } = require("./utils/fechas");
const { obtenerDatosClima, transformarDatos } = require("./services/weatherService");
const { guardarJSON } = require("./utils/archivo");

const app = express();
app.use(express.json());

const PUERTO = process.env.PORT || 3000;
const CLAVE_API = process.env.API_KEY || '891e467b37d848fdb0d45350251105';
const LAT = "4.4136";
const LON = "-76.1547";

app.get("/search", async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = obtenerRangoFechas(3);
        const datosAPI = await obtenerDatosClima({
            lat: LAT,
            lon: LON,
            fechaInicio,
            fechaFin,
            apiKey: CLAVE_API,
        });

        const lecturas = transformarDatos(datosAPI);
        const resultado = {
            ciudad: datosAPI.location.name,
            region: datosAPI.location.region,
            pais: datosAPI.location.country,
            lecturas,
        };

        guardarJSON("clima.json", resultado);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener datos del clima:", error.message);
        res.status(502).json({ error: "No se pudo obtener datos del clima" });
    }
});

app.listen(PUERTO, () => {
    console.log(`Servidor escuchando en el puerto ${PUERTO}`);
});
