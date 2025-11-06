const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Variable para almacenar la conexión a la base de datos de usuarios
let usersConnection = null;

// Conexión a la base de datos de usuarios (colegio-san-pedro)
// Usamos la misma URI pero con el nombre de base de datos diferente
const getUsersConnection = () => {
  if (usersConnection && usersConnection.readyState === 1) {
    return usersConnection;
  }
  
  const mongoUri = process.env.MONGODB_URI;
  // Cambiar el nombre de la base de datos de 'colegio-san-pedro-participacion' a 'colegio-san-pedro'
  const usersDbUri = mongoUri.replace('colegio-san-pedro-participacion', 'colegio-san-pedro');
  
  // Crear conexión a la base de datos de usuarios
  usersConnection = mongoose.createConnection(usersDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  return usersConnection;
};

// Esquema simplificado de User para consultar userType
const getUserModel = () => {
  const connection = getUsersConnection();
  
  // Si el modelo ya existe, devolverlo
  if (connection.models.User) {
    return connection.models.User;
  }
  
  // Crear el modelo
  const userSchema = new mongoose.Schema({
    userType: String,
    status: String
  }, { collection: 'users', strict: false });
  
  return connection.model('User', userSchema);
};

// Middleware para verificar el token JWT
// Nota: Esta API puede usar tokens de la API Web principal
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener userType del token si está disponible
    if (decoded.userType) {
      req.userId = decoded.userId;
      req.userType = decoded.userType;
      return next();
    }
    
    // Si no está en el token, consultar la base de datos de usuarios
    try {
      const User = getUserModel();
      
      const user = await User.findById(decoded.userId).select('userType status');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo'
        });
      }
      
      req.userId = decoded.userId;
      req.userType = user.userType;
      next();
    } catch (dbError) {
      console.error('Error consultando base de datos de usuarios:', dbError);
      // Si hay error al consultar la BD, permitir continuar si el token es válido
      // pero sin userType (el requireTeacher lo rechazará si no es teacher)
      req.userId = decoded.userId;
      req.userType = null;
      next();
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar que el usuario es docente
const requireTeacher = (req, res, next) => {
  if (req.userType !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo para docentes.'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireTeacher
};

