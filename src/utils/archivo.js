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

function limpiarYOrdenarLecturas(datos) {
    if (!datos || !Array.isArray(datos.lecturas)) return datos;

    // 1. Ordenar días por fecha ascendente
    datos.lecturas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // 2. Eliminar días repetidos por fecha (mantener el primero)
    datos.lecturas = datos.lecturas.filter((dia, index, self) =>
        index === self.findIndex(d => d.fecha === dia.fecha)
    );

    // 3. Para cada día, ordenar horas y eliminar horas repetidas
    datos.lecturas.forEach(dia => {
        if (!dia.horas || !Array.isArray(dia.horas)) {
            dia.horas = [];
            return;
        }

        // Ordenar horas ascendente (por string "HH:mm" funciona bien)
        dia.horas.sort((a, b) => a.hora.localeCompare(b.hora));

        // Eliminar horas repetidas (mantener la primera)
        dia.horas = dia.horas.filter((horaObj, idx, self) =>
            idx === self.findIndex(h => h.hora === horaObj.hora)
        );
    });

    return datos;
}

// Agrega horas únicas a un día, para evitar horas repetidas
function agregarHorasUnicas(diaExistente, horasNuevas) {
    if (!diaExistente.horas) diaExistente.horas = [];
    const horasExistentes = new Set(diaExistente.horas.map(h => h.hora));
    horasNuevas.forEach(hora => {
        if (!horasExistentes.has(hora.hora)) {
            diaExistente.horas.push(hora);
        }
    });
}


module.exports = { guardarLecturaCSV, limpiarYOrdenarLecturas, agregarHorasUnicas };
