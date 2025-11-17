const mongoose = require('mongoose');

const AirQualityReadingSchema = new mongoose.Schema(
  {
    ubicacionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ubicacion',
      required: true,
    },
    sensorType: {
      type: String,
      default: 'air_quality',
    },
    value: Number,
    unit: {
      type: String,
      default: 'ppm',
    },
    nh3: Number,
    c6h6: Number,
    alcohol: Number,
    co: Number,
    so2: Number,
    humo: Number,
    voltage: Number,
    rs: Number,
    ratio: Number,
    fanActive: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical'],
      default: 'normal',
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

module.exports = mongoose.model('AirQualityReading', AirQualityReadingSchema);
