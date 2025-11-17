require('dotenv').config();
const mongoose = require('mongoose');

const Ubicacion = require('./models/Ubicacion');
const VibrationReading = require('./models/VibrationReading');
const AirQualityReading = require('./models/AirQualityReading');

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tesis_iot';
    console.log('Conectando a MongoDB en', mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB');

    // Buscar o crear la ubicacion 1er Grado - A
    let ubicacion = await Ubicacion.findOne({ grado: '1er Grado', seccion: 'A' });

    if (!ubicacion) {
      console.log('No existe la ubicación 1er Grado - A, creando...');
      ubicacion = await Ubicacion.create({ grado: '1er Grado', seccion: 'A' });
      console.log('✅ Ubicación creada:', ubicacion._id.toString());
    }

    console.log('Usando ubicacion:', ubicacion._id.toString(), '-', ubicacion.grado, ubicacion.seccion);

    const now = Date.now();

    const vibrationDocs = [];
    const airDocs = [];

    for (let i = 0; i < 5; i++) {
      const ts = new Date(now - i * 60 * 1000); // cada minuto hacia atrás

      vibrationDocs.push({
        ubicacionId: ubicacion._id,
        value: i % 2 === 0 ? 0 : 1,
        isDetected: i % 2 === 1,
        alarmActive: i === 4,
        status: i < 3 ? 'normal' : i === 3 ? 'warning' : 'critical',
        timestamp: ts,
      });

      airDocs.push({
        ubicacionId: ubicacion._id,
        value: 50 + i * 10,
        nh3: 5 + i,
        c6h6: 3 + i,
        alcohol: 10 + i * 2,
        co: 4 + i,
        so2: 2 + i,
        humo: 1 + i,
        voltage: 4.5 + i * 0.05,
        rs: 10 + i,
        ratio: 1 + i * 0.1,
        fanActive: i >= 3,
        status: i < 3 ? 'normal' : i === 3 ? 'warning' : 'critical',
        timestamp: ts,
      });
    }

    const vibResult = await VibrationReading.insertMany(vibrationDocs);
    const airResult = await AirQualityReading.insertMany(airDocs);

    console.log(`✅ Insertadas ${vibResult.length} lecturas de vibración`);
    console.log(`✅ Insertadas ${airResult.length} lecturas de calidad de aire`);

    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB. Seed completado.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error ejecutando seed:', err);
    process.exit(1);
  }
}

main();
