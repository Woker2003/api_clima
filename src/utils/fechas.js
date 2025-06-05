// utils/fechas.js
function obtenerRangoFechas(diasAtras = 7) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() - 1);
    const fechaFin = hoy.toISOString().split("T")[0];
    hoy.setDate(hoy.getDate() - diasAtras);
    const fechaInicio = hoy.toISOString().split("T")[0];
    return { fechaInicio, fechaFin };
}

module.exports = { obtenerRangoFechas };