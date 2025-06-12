const serialService = require('../services/serialService');
const { guardarLecturasAgrupadas } = require('../utils/procesador'); // Asumimos que tienes una función para promediar/guardar

// Detener lectura y procesar datos
const detenerLectura = async (req, res) => {
    try {
        serialService.stop(); // Detiene el puerto serial
        const buffer = serialService.getBuffer(); // Trae las lecturas acumuladas

        if (!buffer.length) {
            return res.status(200).json({ mensaje: 'Lectura detenida, pero no se recibieron datos.' });
        }

        await guardarLecturasAgrupadas(buffer); // Aquí puedes guardar o procesar los datos
        res.json({ mensaje: 'Lectura detenida y datos guardados', total: buffer.length });
    } catch (error) {
        res.status(500).json({ error: 'Error al detener lectura y procesar datos', detalles: error.message });
    }
};

module.exports = {
    detenerLectura
};
