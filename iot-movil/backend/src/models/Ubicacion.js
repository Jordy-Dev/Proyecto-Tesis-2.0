const mongoose = require('mongoose');

const UbicacionSchema = new mongoose.Schema(
  {
    grado: {
      type: String,
      required: true,
      enum: [
        '1er Grado',
        '2do Grado',
        '3er Grado',
        '4to Grado',
        '5to Grado',
        '6to Grado',
      ],
    },
    seccion: {
      type: String,
      required: true,
      enum: ['A', 'B'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ubicacion', UbicacionSchema);
