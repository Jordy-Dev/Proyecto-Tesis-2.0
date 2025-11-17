# Backend Tesis IOT

Backend en Node.js + Express + MongoDB para las lecturas de sensores.

## Instalación

```bash
npm install
```

Configura tu base de datos en `.env` (puedes copiar `.env.example`).

```bash
cp .env.example .env
```

## Ejecutar en desarrollo

```bash
npm run dev
```

La API se expone por defecto en: `http://localhost:3001`.

## Endpoints principales

- `GET /api/ubicaciones?grado=1er%20Grado&seccion=A`
- `POST /api/ubicaciones`
- `GET /api/ubicaciones/:id/vibration-readings`
- `GET /api/ubicaciones/:id/air-quality-readings`
- `GET /api/dashboard?grado=1er%20Grado&seccion=A`
