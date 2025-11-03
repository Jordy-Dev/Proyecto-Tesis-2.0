# API del Colegio San Pedro - Asistente de Lectura IA

Esta es la API backend para el sistema de asistente de lectura con inteligencia artificial del Colegio San Pedro.

## 🚀 Características

- **Autenticación JWT**: Sistema seguro de autenticación con tokens JWT
- **Gestión de usuarios**: Registro y login para estudiantes y docentes
- **Subida de documentos**: Soporte para PDF, DOCX, TXT e imágenes
- **Generación de exámenes**: Creación automática de exámenes basados en documentos
- **Sistema de calificaciones**: Evaluación automática y seguimiento de progreso
- **Panel de docentes**: Monitoreo de estudiantes y estadísticas
- **Base de datos MongoDB**: Almacenamiento robusto y escalable

## 📋 Requisitos

- Node.js 18.0.0 o superior
- MongoDB Atlas (o MongoDB local)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd ApiWeb
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp config.env .env
   ```
   
   Editar el archivo `.env` con tus credenciales:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://doki:<db_password>@cluster0.bx5xxfk.mongodb.net/colegio-san-pedro?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
   JWT_EXPIRE=7d
   ```

4. **Iniciar el servidor**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## 📚 Estructura del Proyecto

```
ApiWeb/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de MongoDB
│   ├── controllers/
│   │   ├── authController.js    # Controlador de autenticación
│   │   ├── documentController.js # Controlador de documentos
│   │   ├── examController.js    # Controlador de exámenes
│   │   └── userController.js    # Controlador de usuarios
│   ├── middleware/
│   │   ├── auth.js             # Middleware de autenticación
│   │   ├── errorHandler.js     # Manejo de errores
│   │   └── validation.js       # Validación de datos
│   ├── models/
│   │   ├── User.js             # Modelo de usuario
│   │   ├── Document.js         # Modelo de documento
│   │   ├── Exam.js             # Modelo de examen
│   │   ├── Question.js         # Modelo de pregunta
│   │   ├── QuestionOption.js   # Modelo de opción
│   │   ├── StudentAnswer.js    # Modelo de respuesta
│   │   ├── ExamResult.js       # Modelo de resultado
│   │   └── StudentProgress.js  # Modelo de progreso
│   ├── routes/
│   │   ├── authRoutes.js       # Rutas de autenticación
│   │   ├── documentRoutes.js   # Rutas de documentos
│   │   ├── examRoutes.js       # Rutas de exámenes
│   │   └── userRoutes.js       # Rutas de usuarios
│   └── server.js               # Servidor principal
├── config.env                  # Variables de entorno
├── package.json                # Dependencias del proyecto
└── README.md                   # Este archivo
```

## 🔗 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `PUT /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/logout` - Cerrar sesión

### Documentos
- `POST /api/documents/upload` - Subir documento
- `GET /api/documents/my-documents` - Obtener mis documentos
- `GET /api/documents/by-grade` - Obtener documentos por grado (docentes)
- `GET /api/documents/:id` - Obtener documento específico
- `PUT /api/documents/:id` - Actualizar documento
- `DELETE /api/documents/:id` - Eliminar documento
- `POST /api/documents/:id/process` - Procesar documento con IA

### Exámenes
- `POST /api/exams/create` - Crear examen
- `GET /api/exams/my-exams` - Obtener mis exámenes
- `GET /api/exams/by-grade` - Obtener exámenes por grado (docentes)
- `GET /api/exams/:id` - Obtener examen específico
- `POST /api/exams/:id/start` - Iniciar examen
- `POST /api/exams/:id/submit` - Enviar examen
- `GET /api/exams/:id/questions` - Obtener preguntas del examen
- `GET /api/exams/:id/result` - Obtener resultado del examen

### Usuarios (Docentes)
- `GET /api/users/students` - Obtener estudiantes
- `GET /api/users/students/:id` - Obtener estudiante específico
- `GET /api/users/students/:id/progress` - Obtener progreso del estudiante
- `GET /api/users/students/:id/exams` - Obtener exámenes del estudiante
- `GET /api/users/statistics` - Obtener estadísticas generales
- `GET /api/users/ranking` - Obtener ranking de estudiantes

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Incluye el token en el header de autorización:

```
Authorization: Bearer <tu_token_jwt>
```

## 📊 Base de Datos

### Esquema de Base de Datos

La API utiliza MongoDB con los siguientes modelos principales:

- **Users**: Usuarios (estudiantes y docentes)
- **Documents**: Documentos subidos por estudiantes
- **Exams**: Exámenes generados automáticamente
- **Questions**: Preguntas de los exámenes
- **QuestionOptions**: Opciones de respuesta
- **StudentAnswers**: Respuestas de los estudiantes
- **ExamResults**: Resultados de los exámenes
- **StudentProgress**: Progreso académico de los estudiantes

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

## 🚀 Despliegue

### Variables de Entorno de Producción

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://doki:<db_password>@cluster0.bx5xxfk.mongodb.net/colegio-san-pedro?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=tu_jwt_secret_muy_seguro_de_produccion
JWT_EXPIRE=7d
CORS_ORIGIN=https://tu-dominio.com
```

### Comandos de Despliegue

```bash
# Instalar dependencias de producción
npm install --production

# Iniciar servidor
npm start
```

## 📝 Ejemplos de Uso

### Registrar Estudiante

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@estudiante.com",
    "password": "password123",
    "userType": "student",
    "grade": "4to Grado",
    "section": "A"
  }'
```

### Iniciar Sesión

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@estudiante.com",
    "password": "password123",
    "userType": "student"
  }'
```

### Subir Documento

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer <tu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "documento.pdf",
    "fileType": "pdf",
    "fileSize": 1024000
  }'
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico, contacta a:
- Email: soporte@colegiosanpedro.edu.pe
- Teléfono: +51 (01) 123-4567

## 🏫 Colegio San Pedro

Esta API es parte del sistema educativo del Colegio San Pedro, diseñado para mejorar la comprensión lectora de nuestros estudiantes mediante tecnología de inteligencia artificial.

---

**Desarrollado con ❤️ para el Colegio San Pedro**


