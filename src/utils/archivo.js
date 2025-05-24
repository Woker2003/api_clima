// utils/archivo.js
const fs = require("fs");

function guardarJSON(nombreArchivo, datos) {
    fs.writeFileSync(nombreArchivo, JSON.stringify(datos, null, 2), "utf8");
    console.log(`Datos guardados en ${nombreArchivo}`);
}

module.exports = { guardarJSON };
