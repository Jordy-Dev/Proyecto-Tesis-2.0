require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const ubicacionRoutes = require('./routes/ubicacion.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const sensorsRoutes = require('./routes/sensors.routes');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Tesis Backend OK' });
});

app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sensors', sensorsRoutes);

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tesis_iot', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' Error conectando a MongoDB', err);
    process.exit(1);
  });
