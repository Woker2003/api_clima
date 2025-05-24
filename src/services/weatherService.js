// services/weatherService.js
const axios = require("axios");

async function obtenerDatosClima({ lat, lon, fechaInicio, fechaFin, apiKey }) {
    const respuesta = await axios.get("http://api.weatherapi.com/v1/history.json", {
        params: {
            key: apiKey,
            q: `${lat},${lon}`,
            dt: fechaInicio,
            end_dt: fechaFin,
            lang: "es",
        },
    });
    return respuesta.data;
}

function transformarDatos(data) {
    return data.forecast.forecastday.map((data, idx) => ({
        id: idx,
        fecha: data.date,
        temperaturaMax: data.day.maxtemp_c,
        temperaturaMin: data.day.mintemp_c,
        precipitacion: data.day.totalprecip_mm,
        horas: data.hour.map((h, i) => ({
            id: i,
            hora: h.time.split(' ')[1],
            temp: h.temp_c,
            vientoKph: h.wind_kph,
            presionMb: h.pressure_mb,
            precipitMm: h.precip_mm,
            humedad: h.humidity,
            sensacion: h.feelslike_c
        }))
    }));
}

module.exports = { obtenerDatosClima, transformarDatos };
