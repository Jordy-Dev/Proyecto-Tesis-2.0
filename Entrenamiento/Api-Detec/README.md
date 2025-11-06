# API de Detección de Participación - Colegio San Pedro

Esta es la API backend para el sistema de detección de participación del Colegio San Pedro. Permite a los docentes registrar y monitorear las participaciones de los estudiantes durante las clases.

## 🚀 Características

- **Gestión de sesiones**: Crear, actualizar y finalizar sesiones de participación
- **Monitoreo en tiempo real**: Actualización de contadores y duración de sesiones
- **Estadísticas**: Análisis de participación por sección y período de tiempo
- **Autenticación JWT**: Sistema seguro usando tokens JWT (compatible con ApiWeb)
- **Base de datos MongoDB**: Almacenamiento robusto y escalable

## 📋 Requisitos

- Node.js 18.0.0 o superior
- MongoDB Atlas (o MongoDB local)
- npm o yarn

## 🛠️ Instalación

1. **Navegar al directorio**
   ```bash
   cd Entrenamiento/Api-Detec
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   El archivo `config.env` ya está configurado con:
   - Puerto: 3002 (diferente al ApiWeb que usa 3001)
   - MongoDB: Mismas credenciales que ApiWeb pero base de datos diferente
   - JWT: Mismo secret para compatibilidad con tokens de ApiWeb

4. **Iniciar el servidor**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## 📚 Estructura del Proyecto

```
Api-Detec/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de MongoDB
│   ├── controllers/
│   │   └── participationController.js  # Controlador de participación
│   ├── middleware/
│   │   ├── auth.js              # Middleware de autenticación
│   │   └── errorHandler.js     # Manejo de errores
│   ├── models/
│   │   └── ParticipationSession.js  # Modelo de sesión de participación
│   ├── routes/
│   │   └── participationRoutes.js   # Rutas de la API
│   └── server.js               # Servidor principal
├── config.env                  # Variables de entorno
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

## 🔌 Endpoints de la API

### Autenticación
Todas las rutas requieren un token JWT válido en el header:
```
Authorization: Bearer <token>
```

### Sesiones de Participación

#### Crear nueva sesión
```http
POST /api/participation/sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "teacherName": "Profesor Juan Pérez",
  "teacherGrade": "4to Grado",
  "section": "A"
}
```

#### Obtener mis sesiones
```http
GET /api/participation/sessions?grade=4to Grado&section=A&status=active&page=1&limit=10
Authorization: Bearer <token>
```

#### Obtener sesión específica
```http
GET /api/participation/sessions/:sessionId
Authorization: Bearer <token>
```

#### Actualizar sesión activa
```http
PUT /api/participation/sessions/:sessionId
Content-Type: application/json
Authorization: Bearer <token>

{
  "participationCount": 15,
  "sessionDuration": 1200
}
```

#### Finalizar sesión
```http
POST /api/participation/sessions/:sessionId/complete
Content-Type: application/json
Authorization: Bearer <token>

{
  "participationCount": 15,
  "sessionDuration": 1200
}
```

#### Obtener estadísticas
```http
GET /api/participation/statistics?grade=4to Grado&section=A
Authorization: Bearer <token>
```

### Health Check
```http
GET /api/health
```

## 📊 Modelo de Datos

### ParticipationSession

```javascript
{
  teacherId: ObjectId,          // ID del docente
  teacherName: String,          // Nombre del docente
  teacherGrade: String,         // Grado (1er-6to Grado)
  section: String,             // Sección (A o B)
  participationCount: Number,   // Contador de participaciones
  sessionDuration: Number,     // Duración en segundos
  startTime: Date,             // Hora de inicio
  endTime: Date,               // Hora de finalización (null si activa)
  status: String,              // 'active' o 'completed'
  createdAt: Date,             // Fecha de creación
  updatedAt: Date              // Fecha de actualización
}
```

## 🔒 Seguridad

- Autenticación JWT requerida para todas las rutas
- Solo docentes pueden acceder a los endpoints
- Validación de permisos: cada docente solo puede acceder a sus propias sesiones
- Rate limiting para prevenir abuso
- CORS configurado para permitir solicitudes desde el frontend

## 🔗 Integración con Frontend

Esta API está diseñada para trabajar con el componente `HandParticipation.jsx` del proyecto Entrenamiento. El frontend debe:

1. Usar el token JWT de la API Web principal
2. Crear una sesión al iniciar la detección
3. Actualizar periódicamente el contador y duración
4. Finalizar la sesión al detener la detección

## 📝 Ejemplo de Uso Completo

```javascript
// 1. Crear sesión al iniciar
const createSession = async () => {
  const response = await fetch('http://localhost:3002/api/participation/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      teacherName: user.name,
      teacherGrade: user.grade,
      section: selectedSection
    })
  });
  const { data } = await response.json();
  return data.session._id;
};

// 2. Actualizar sesión periódicamente
const updateSession = async (sessionId, count, duration) => {
  await fetch(`http://localhost:3002/api/participation/sessions/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      participationCount: count,
      sessionDuration: duration
    })
  });
};

// 3. Finalizar sesión
const completeSession = async (sessionId, count, duration) => {
  await fetch(`http://localhost:3002/api/participation/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      participationCount: count,
      sessionDuration: duration
    })
  });
};
```

## 🏫 Colegio San Pedro

Esta API es parte del sistema educativo del Colegio San Pedro, diseñado para mejorar el monitoreo de participación estudiantil mediante tecnología de detección de gestos.

