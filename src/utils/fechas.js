// utils/fechas.js
function obtenerRangoFechas(diasAtras = 3) {
    const hoy = new Date();
    const fechaFin = hoy.toISOString().split("T")[0];
    hoy.setDate(hoy.getDate() - diasAtras);
    const fechaInicio = hoy.toISOString().split("T")[0];
    return { fechaInicio, fechaFin };
}

module.exports = { obtenerRangoFechas };