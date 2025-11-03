# IoT Monitor - Sistema de Monitoreo Inteligente

Una aplicación móvil profesional desarrollada con React Native y Expo para el monitoreo en tiempo real de sensores IoT.

## 🚀 Características

### 🔐 Autenticación Segura
- Sistema de login con credenciales seguras
- Almacenamiento seguro de tokens de autenticación
- Gestión de sesiones de usuario

### 📊 Dashboard Profesional
- Visualización en tiempo real de datos de sensores
- Tarjetas informativas con estado de sensores
- Indicadores de estado (Normal, Advertencia, Crítico)
- Actualización automática de datos

### 📈 Gráficos Interactivos
- Gráficos de línea para tendencias temporales
- Visualización de datos de vibración (frecuencia y amplitud)
- Monitoreo de calidad de aire (CO₂, TVOC, temperatura, humedad)
- Gráficos duales para comparación de métricas

### 📋 Historial con Filtros Avanzados
- Registros históricos completos de todos los sensores
- Filtros por fecha (hoy, semana, mes)
- Filtros por estado de alerta
- Búsqueda en valores de sensores
- Interfaz intuitiva para navegación

### ⚙️ Configuración Completa
- Configuración de notificaciones
- Modo oscuro/claro
- Actualización automática de datos
- Exportación de datos
- Información detallada de sensores

## 🔧 Sensores Soportados

### Sensor de Vibración SW-18210
- **Tipo**: Piezoeléctrico
- **Rango**: 45-70 Hz
- **Precisión**: ±2%
- **Métricas**: Frecuencia, Amplitud
- **Estado**: Monitoreo continuo

### Sensor de Calidad de Aire MQ-135
- **Tipo**: Multifuncional
- **Métricas**: CO₂, TVOC, Temperatura, Humedad
- **Rango CO₂**: 400-1000 ppm
- **Rango TVOC**: 0-1000 ppb
- **Precisión**: ±3%

## 🛠️ Tecnologías Utilizadas

- **React Native**: Framework principal
- **Expo**: Plataforma de desarrollo
- **TypeScript**: Tipado estático
- **React Navigation**: Navegación entre pantallas
- **React Native Chart Kit**: Gráficos interactivos
- **Expo Linear Gradient**: Gradientes visuales
- **Expo Secure Store**: Almacenamiento seguro
- **Ionicons**: Iconografía moderna

## 📱 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Expo CLI
- Dispositivo móvil con Expo Go o emulador

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd iot-movil
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**
   ```bash
   npm start
   ```

4. **Ejecutar en dispositivo**
   - Escanear el código QR con Expo Go (Android/iOS)
   - O presionar 'a' para Android, 'i' para iOS

## 🔑 Credenciales de Prueba

Para acceder a la aplicación, utiliza las siguientes credenciales:

- **Email**: `admin@iot.com`
- **Contraseña**: `admin123`

## 📊 Datos de Ejemplo

La aplicación incluye 10 registros de ejemplo para cada sensor:

### Datos de Vibración
- Frecuencias entre 45-65 Hz
- Amplitudes entre 0.1-0.4
- Estados: Normal, Advertencia, Crítico
- Intervalos de 2 horas

### Datos de Calidad de Aire
- CO₂ entre 400-600 ppm
- TVOC entre 50-150 ppb
- Temperatura entre 20-30°C
- Humedad entre 40-70%
- Estados basados en umbrales

## 🎨 Diseño y UX

### Principios de Diseño
- **Material Design**: Interfaz moderna y consistente
- **Gradientes**: Efectos visuales atractivos
- **Iconografía**: Iconos intuitivos y reconocibles
- **Colores**: Paleta profesional con indicadores de estado
- **Tipografía**: Jerarquía clara y legible

### Experiencia de Usuario
- **Navegación intuitiva**: Tabs claras y accesibles
- **Feedback visual**: Estados de carga y confirmaciones
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Accesibilidad**: Contraste adecuado y elementos táctiles

## 🔄 Funcionalidades Avanzadas

### Actualización en Tiempo Real
- Pull-to-refresh en todas las pantallas
- Actualización automática configurable
- Indicadores de estado de conexión

### Gestión de Datos
- Almacenamiento local seguro
- Exportación de datos en CSV
- Limpieza de cache
- Filtros avanzados

### Notificaciones
- Alertas de estado crítico
- Notificaciones configurables
- Sistema de alertas por umbrales

## 🚀 Próximas Mejoras

- [ ] Integración con APIs reales de sensores
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] Sincronización en la nube
- [ ] Análisis predictivo
- [ ] Reportes automáticos
- [ ] Multi-idioma
- [ ] Temas personalizables

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: support@iot-monitor.com
- **Teléfono**: +1 (234) 567-8900

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**IoT Monitor v1.0.0** - Sistema de Monitoreo Inteligente