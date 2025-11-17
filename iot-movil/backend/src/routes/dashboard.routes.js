const express = require('express');
const Ubicacion = require('../models/Ubicacion');
const VibrationReading = require('../models/VibrationReading');
const AirQualityReading = require('../models/AirQualityReading');

const router = express.Router();

// Dashboard por grado y seccion
// GET /api/dashboard?grado=1er%20Grado&seccion=A
router.get('/', async (req, res) => {
  try {
    const { grado, seccion } = req.query;
    if (!grado) {
      return res.status(400).json({
        message: 'Debe enviar grado en query ?grado=..',
      });
    }

    const filter = { grado };
    if (seccion) {
      filter.seccion = seccion;
    }

    const ubicaciones = await Ubicacion.find(filter);

    const result = await Promise.all(
      ubicaciones.map(async (u) => {
        const lastVibration = await VibrationReading.findOne({ ubicacionId: u._id })
          .sort({ timestamp: -1 })
          .lean();

        const lastAir = await AirQualityReading.findOne({ ubicacionId: u._id })
          .sort({ timestamp: -1 })
          .lean();

        return {
          ubicacion: u,
          lastVibration,
          lastAirQuality: lastAir,
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo dashboard', error);
    res.status(500).json({ message: 'Error obteniendo dashboard' });
  }
});

module.exports = router;
