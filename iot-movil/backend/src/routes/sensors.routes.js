const express = require('express');
const VibrationReading = require('../models/VibrationReading');
const AirQualityReading = require('../models/AirQualityReading');
const Ubicacion = require('../models/Ubicacion');

const router = express.Router();

// POST /api/sensors/vibration
router.post('/vibration', async (req, res) => {
  try {
    const { grado, seccion, isDetected, alarmActive } = req.body;
    
    // Buscar o crear ubicación específica
    let ubicacion = await Ubicacion.findOne({ grado, seccion });
    if (!ubicacion) {
      // Si no existe, crear la ubicación especificada
      ubicacion = await Ubicacion.create({
        grado: grado || '1er Grado',
        seccion: seccion || 'A'
      });
    }

    const vibrationReading = await VibrationReading.create({
      ubicacionId: ubicacion._id,
      isDetected: Boolean(isDetected),
      alarmActive: Boolean(alarmActive),
      value: isDetected ? 1 : 0,
      timestamp: new Date(),
      status: isDetected ? 'warning' : 'normal'
    });

    console.log('✅ Datos de vibración guardados:', vibrationReading);
    res.status(201).json({ 
      message: 'Datos de vibración guardados',
      data: vibrationReading 
    });
  } catch (error) {
    console.error('Error guardando datos de vibración:', error);
    res.status(500).json({ 
      message: 'Error guardando datos de vibración',
      error: error.message 
    });
  }
});

// GET /api/sensors/vibration
router.get('/vibration', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const vibrationReadings = await VibrationReading.find(query)
      .populate('ubicacionId')
      .sort({ timestamp: -1 })
      .limit(100); // Limitar a últimos 100 registros
    
    res.status(200).json({ 
      message: 'Datos de vibración obtenidos',
      data: vibrationReadings 
    });
  } catch (error) {
    console.error('Error obteniendo datos de vibración:', error);
    res.status(500).json({ 
      message: 'Error obteniendo datos de vibración',
      error: error.message 
    });
  }
});

// POST /api/sensors/air-quality
router.post('/air-quality', async (req, res) => {
  try {
    const { 
      grado, seccion, nh3, c6h6, alcohol, co, so2, humo, 
      voltage, rs, ratio, fanActive 
    } = req.body;
    
    // Buscar o crear ubicación específica
    let ubicacion = await Ubicacion.findOne({ grado, seccion });
    if (!ubicacion) {
      // Si no existe, crear la ubicación especificada
      ubicacion = await Ubicacion.create({
        grado: grado || '1er Grado',
        seccion: seccion || 'A'
      });
    }

    // Determinar estado basado en niveles críticos
    let status = 'normal';
    if (co > 50 || humo > 100) {
      status = 'critical';
    } else if (co > 30 || humo > 70) {
      status = 'warning';
    }

    const airQualityReading = await AirQualityReading.create({
      ubicacionId: ubicacion._id,
      nh3: parseFloat(nh3) || 0,
      c6h6: parseFloat(c6h6) || 0,
      alcohol: parseFloat(alcohol) || 0,
      co: parseFloat(co) || 0,
      so2: parseFloat(so2) || 0,
      humo: parseFloat(humo) || 0,
      voltage: parseFloat(voltage) || 0,
      rs: parseFloat(rs) || 0,
      ratio: parseFloat(ratio) || 0,
      fanActive: Boolean(fanActive),
      timestamp: new Date(),
      status
    });

    console.log('✅ Datos de calidad de aire guardados:', airQualityReading);
    res.status(201).json({ 
      message: 'Datos de calidad de aire guardados',
      data: airQualityReading 
    });
  } catch (error) {
    console.error('Error guardando datos de calidad de aire:', error);
    res.status(500).json({ 
      message: 'Error guardando datos de calidad de aire',
      error: error.message 
    });
  }
});

// GET /api/sensors/air-quality
router.get('/air-quality', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const airQualityReadings = await AirQualityReading.find(query)
      .populate('ubicacionId')
      .sort({ timestamp: -1 })
      .limit(100); // Limitar a últimos 100 registros
    
    res.status(200).json({ 
      message: 'Datos de calidad de aire obtenidos',
      data: airQualityReadings 
    });
  } catch (error) {
    console.error('Error obteniendo datos de calidad de aire:', error);
    res.status(500).json({ 
      message: 'Error obteniendo datos de calidad de aire',
      error: error.message 
    });
  }
});

module.exports = router;
