const express = require('express');
const Ubicacion = require('../models/Ubicacion');
const VibrationReading = require('../models/VibrationReading');
const AirQualityReading = require('../models/AirQualityReading');

const router = express.Router();

// Listar ubicaciones, opcionalmente filtrando por grado y seccion
router.get('/', async (req, res) => {
  try {
    const { grado, seccion } = req.query;
    const filter = {};
    if (grado) filter.grado = grado;
    if (seccion) filter.seccion = seccion;

    const ubicaciones = await Ubicacion.find(filter).sort({ grado: 1, seccion: 1 });
    res.json(ubicaciones);
  } catch (error) {
    console.error('Error obteniendo ubicaciones', error);
    res.status(500).json({ message: 'Error obteniendo ubicaciones' });
  }
});

// Crear ubicacion (puedes usar esto para registrar grados/secciones)
router.post('/', async (req, res) => {
  try {
    const { grado, seccion } = req.body;
    const ubicacion = await Ubicacion.create({ grado, seccion });
    res.status(201).json(ubicacion);
  } catch (error) {
    console.error('Error creando ubicacion', error);
    res.status(400).json({ message: 'Error creando ubicacion', error: error.message });
  }
});

// Obtener lecturas de vibración por ubicacion
router.get('/:id/vibration-readings', async (req, res) => {
  try {
    const { id } = req.params;
    const readings = await VibrationReading.find({ ubicacionId: id })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(readings);
  } catch (error) {
    console.error('Error obteniendo lecturas de vibracion', error);
    res.status(500).json({ message: 'Error obteniendo lecturas de vibracion' });
  }
});

// Obtener lecturas de calidad de aire por ubicacion
router.get('/:id/air-quality-readings', async (req, res) => {
  try {
    const { id } = req.params;
    const readings = await AirQualityReading.find({ ubicacionId: id })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(readings);
  } catch (error) {
    console.error('Error obteniendo lecturas de calidad de aire', error);
    res.status(500).json({ message: 'Error obteniendo lecturas de calidad de aire' });
  }
});

module.exports = router;
