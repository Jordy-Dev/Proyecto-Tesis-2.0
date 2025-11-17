const mongoose = require('mongoose');

const VibrationReadingSchema = new mongoose.Schema(
  {
    ubicacionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ubicacion',
      required: true,
    },
    sensorType: {
      type: String,
      default: 'vibration',
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: 'binary',
    },
    isDetected: {
      type: Boolean,
      default: false,
    },
    alarmActive: {
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

module.exports = mongoose.model('VibrationReading', VibrationReadingSchema);
