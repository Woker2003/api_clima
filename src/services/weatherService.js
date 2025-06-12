const axios = require("axios"); // libreria usada para hacer peticiones https

//pido los datos a la API y los retorno
async function obtenerDatosClima({ lat, lon, fechaInicio, fechaFin, apiKey }) {
    // almacenamos los datos que obtenemos de la peticion a la API
    const respuesta = await axios.get("http://api.weatherapi.com/v1/history.json", {
        params: {
            //le pasamos los parametros a la api
            key: apiKey,
            q: `${lat},${lon}`,
            dt: fechaInicio,
            end_dt: fechaFin,
            lang: "es",
        },
    });
    return respuesta.data; // devolvemos la "carpeta" data de la respuesta que nos dio la API
}
// formateamos los datos que recibimos para que sean mas legibles
// recibimos la infromacion de la api para formatear
// tambien una id opcional, si lo mandamos es por que ya hay lecturas y debe contar apartir de esta id, si no, por default es 0
function transformarDatos(data, id = 0) {
    // hacemos un map (parecido a un for in) donde dia equivale a cada dia de la respuesta y idx un contador para ayudarnos
    return data.forecast.forecastday.map((dia, idx) => ({
        id: id + idx, // si recibimos una id la sumamos al contador
        // almacenamos los datoc con nuevos nombre para mayor facilidad de lectura
        fecha: dia.date,
        temperaturaMax: dia.day.maxtemp_c,
        temperaturaMin: dia.day.mintemp_c,
        precipitacion: dia.day.totalprecip_mm,
        horas: dia.hour.map((h, i) => { // hacemos de nuevo un map el cual va leer cada hora del dia
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
