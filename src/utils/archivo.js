// utils/archivo.js
const fs = require("fs");
const csvPath = './data/historial.csv';

function guardarJSON(nombreArchivo, datos) {
    fs.writeFileSync(`../${nombreArchivo}`, JSON.stringify(datos, null, 2), "utf8");
    console.log(`Datos guardados en ${nombreArchivo}`);
}
function guardarLecturaCSV(fecha, data) {
    const linea = `${fecha},${data.hora},${data.temp},${data.humedad},${data.presionMb},${data.vientoKph},${data.lluvia},${data.nubes}\n`;

    const encabezado = "fecha,hora,temperatura,humedad,presion,viento,lluvia,nubes\n";
    if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, encabezado);
    }

    fs.appendFileSync(csvPath, linea);
}


module.exports = { guardarJSON, guardarLecturaCSV };
