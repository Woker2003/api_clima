const axios = require("axios");

//pido los datos a la API y los retorno
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
// formateamos los datos que recibimos para que sean mas legibles
function transformarDatos(data, id = 0) {
    return data.forecast.forecastday.map((dia, idx) => ({
        id: id + idx,
        fecha: dia.date,
        temperaturaMax: dia.day.maxtemp_c,
        temperaturaMin: dia.day.mintemp_c,
        precipitacion: dia.day.totalprecip_mm,
        horas: dia.hour.map((h, i) => {
            return {
                id: i,
                hora: h.time.split(" ")[1],
                temp: h.temp_c,
                vientoKph: h.wind_kph,
                presionMb: h.pressure_mb,
                lluvia: Math.trunc(h.precip_mm) > 1 ? 1 : 0, // 1 si hay lluvia significativa, 0 si no
                humedad: h.humidity,
                nubes: h.cloud,
            };
        })
    }));
}

module.exports = { obtenerDatosClima, transformarDatos };
