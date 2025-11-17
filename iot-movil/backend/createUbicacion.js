// Script para crear la ubicación 1er Grado - A usando la API del backend
// Ejecutar con: node createUbicacion.js

const http = require('http');

function main() {
  const data = JSON.stringify({
    grado: '1er Grado',
    seccion: 'A',
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/ubicaciones',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };

  const req = http.request(options, (res) => {
    let body = '';

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Respuesta:', body.toString());
    });
  });

  req.on('error', (err) => {
    console.error('Error en la petición:', err);
  });

  req.write(data);
  req.end();
}

main();
