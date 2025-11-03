# 🧠 Colegio San Pedro - Asistente de Lectura IA

Una plataforma educativa innovadora del Colegio San Pedro que utiliza inteligencia artificial para mejorar la comprensión lectora en estudiantes de primaria (4to, 5to y 6to grado).

## ✨ Características Principales

### 🎯 Para Estudiantes del Colegio San Pedro
- **Carga de Documentos**: Sube archivos PDF, Word, TXT o imágenes
- **Exámenes Generados por IA**: 10 preguntas personalizadas basadas en el contenido
- **Seguimiento de Progreso**: Visualiza tu evolución académica
- **Interfaz Interactiva**: Diseño atractivo y fácil de usar con modo oscuro

### 👨‍🏫 Para Docentes del Colegio San Pedro
- **Monitoreo en Tiempo Real**: Supervisa el progreso de todos tus estudiantes
- **Filtros por Grado y Sección**: Organiza por 4to, 5to, 6to grado y secciones A, B, C
- **Analíticas Detalladas**: Estadísticas completas del rendimiento académico
- **Identificación de Necesidades**: Detecta estudiantes que requieren atención adicional

### 🤖 Tecnología IA del Colegio San Pedro
- **Integración con Ollama**: Modelos de IA locales para privacidad total
- **Análisis Inteligente**: Extrae contenido y genera preguntas contextuales
- **Modo de Respaldo**: Funciona sin IA cuando Ollama no está disponible
- **Modo Oscuro**: Interfaz adaptativa con tema claro y oscuro

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Ollama (opcional, para funcionalidad completa de IA)

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd asistente-lectura-ia
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Ollama (Opcional)
Para funcionalidad completa de IA:

```bash
# Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Descargar modelo (recomendado: llama2)
ollama pull llama2

# Iniciar Ollama
ollama serve
```

### 4. Ejecutar la Aplicación
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── DocumentUpload.jsx
│   └── ProtectedRoute.jsx
├── contexts/           # Contextos de React
│   └── AuthContext.jsx
├── pages/             # Páginas principales
│   ├── LandingPage.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── StudentDashboard.jsx
│   ├── TeacherDashboard.jsx
│   └── ExamPage.jsx
├── services/          # Servicios y lógica de negocio
│   ├── ollamaService.js
│   └── progressService.js
├── App.jsx           # Componente principal
├── main.jsx         # Punto de entrada
└── index.css        # Estilos globales
```

## 🎨 Tecnologías Utilizadas

### Frontend
- **React 18**: Framework principal
- **Vite**: Herramienta de construcción
- **Tailwind CSS**: Framework de estilos
- **Framer Motion**: Animaciones
- **React Router**: Navegación
- **React Dropzone**: Carga de archivos
- **React Hot Toast**: Notificaciones

### Backend/IA
- **Ollama**: Modelos de IA locales
- **LocalStorage**: Persistencia de datos
- **Axios**: Cliente HTTP

## 📱 Funcionalidades Detalladas

### Sistema de Autenticación
- Login/Registro para estudiantes y docentes
- Selección de grado (4to, 5to, 6to) y sección (A, B, C)
- Autenticación simulada (para desarrollo)

### Carga de Documentos
- **Formatos Soportados**: PDF, Word (.doc/.docx), TXT, Imágenes
- **Tamaño Máximo**: 10MB
- **Procesamiento**: Extracción de texto y análisis con IA

### Generación de Exámenes
- **10 Preguntas**: Generadas automáticamente por IA
- **Opciones Múltiples**: 4 opciones por pregunta
- **Explicaciones**: Respuestas detalladas para cada pregunta
- **Tiempo Límite**: 10 minutos por examen

### Seguimiento de Progreso
- **Estadísticas Individuales**: Promedio, mejor/peor puntuación
- **Tendencias**: Análisis de mejora o declive
- **Recomendaciones**: Sugerencias personalizadas
- **Logros**: Sistema de reconocimientos

### Dashboard de Docente
- **Vista General**: Resumen de toda la clase
- **Filtros**: Por grado y sección
- **Alertas**: Estudiantes que necesitan atención
- **Exportación**: Datos para análisis externo

## 🔧 Configuración Avanzada

### Variables de Entorno
Crear archivo `.env.local`:
```env
VITE_OLLAMA_URL=http://localhost:11434
VITE_APP_NAME=Asistente de Lectura IA
```

### Personalización de Modelos IA
En `src/services/ollamaService.js`:
```javascript
// Cambiar modelo por defecto
this.model = 'llama2' // o 'mistral', 'codellama', etc.
```

### Estilos Personalizados
Modificar `tailwind.config.js` para personalizar colores y animaciones.

## 📊 Uso de la Aplicación

### Para Estudiantes del Colegio San Pedro
 1. **Registro**: Crear cuenta seleccionando grado y sección
 2. **Subir Documento**: Arrastrar archivo a la zona de carga
 3. **Realizar Examen**: Responder 10 preguntas generadas por IA
 4. **Ver Resultados**: Revisar puntuación y explicaciones
 5. **Seguir Progreso**: Monitorear evolución académica en el dashboard
 6. **Modo Oscuro**: Alternar entre tema claro y oscuro según preferencia

### Para Docentes del Colegio San Pedro
 1. **Registro**: Crear cuenta como docente
 2. **Seleccionar Clase**: Filtrar por grado y sección
 3. **Monitorear**: Ver progreso de todos los estudiantes
 4. **Identificar Necesidades**: Detectar estudiantes con dificultades
 5. **Analizar Datos**: Usar estadísticas para mejorar enseñanza
 6. **Modo Oscuro**: Interfaz adaptativa para mejor experiencia visual

## 🛠️ Desarrollo

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construcción para producción
npm run preview      # Vista previa de producción
npm run lint         # Linter de código
```

### Agregar Nuevas Funcionalidades
1. Crear componente en `src/components/`
2. Agregar ruta en `src/App.jsx`
3. Actualizar navegación según sea necesario

### Integración con Base de Datos
Para producción, reemplazar `localStorage` con:
- Firebase Firestore
- Supabase
- MongoDB
- PostgreSQL

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
npm run build
# Subir carpeta 'dist' a Vercel
```

### Netlify
```bash
npm run build
# Arrastrar carpeta 'dist' a Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

### Problemas Comunes

**Ollama no se conecta:**
- Verificar que Ollama esté ejecutándose: `ollama serve`
- Comprobar URL en `ollamaService.js`
- La aplicación funciona en modo de respaldo sin Ollama

**Error de CORS:**
- Ollama debe estar configurado para permitir CORS
- Usar proxy en desarrollo si es necesario

**Archivos no se procesan:**
- Verificar formato soportado
- Comprobar tamaño del archivo (máx. 10MB)
- Revisar consola del navegador para errores

### Contacto
- Email: info@colegiosanpedro.edu.pe
- Teléfono: +51 (01) 123-4567
- Dirección: Lima, Perú

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] Integración con base de datos real
- [ ] Soporte para más idiomas
- [ ] Análisis de sentimientos en respuestas
- [ ] Gamificación (puntos, badges)
- [ ] Modo offline
- [ ] API REST para integraciones
- [ ] Aplicación móvil
- [ ] Integración con Google Classroom

---

**¡Gracias por usar el Asistente de Lectura IA del Colegio San Pedro! 🎉**

*Desarrollado con ❤️ para mejorar la educación en primaria del Colegio San Pedro*
