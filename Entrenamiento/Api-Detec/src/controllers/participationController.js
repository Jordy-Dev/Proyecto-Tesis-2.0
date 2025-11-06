const ParticipationSession = require('../models/ParticipationSession');

// Crear una nueva sesión de participación
const createSession = async (req, res, next) => {
  try {
    const { teacherName, teacherGrade, section } = req.body;
    const teacherId = req.userId;

    // Validar que se proporcionen los datos requeridos
    if (!teacherName || !teacherGrade || !section) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: teacherName, teacherGrade, section'
      });
    }

    // Crear nueva sesión
    const session = new ParticipationSession({
      teacherId,
      teacherName,
      teacherGrade,
      section,
      participationCount: 0,
      sessionDuration: 0,
      status: 'active'
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Sesión de participación creada',
      data: {
        session
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar una sesión de participación (contador y duración)
const updateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { participationCount, sessionDuration } = req.body;

    const session = await ParticipationSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    // Verificar que la sesión pertenece al docente
    if (session.teacherId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta sesión'
      });
    }

    // Verificar que la sesión esté activa
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden actualizar sesiones activas'
      });
    }

    // Actualizar campos
    if (participationCount !== undefined) {
      session.participationCount = participationCount;
    }
    if (sessionDuration !== undefined) {
      session.sessionDuration = sessionDuration;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Sesión actualizada',
      data: {
        session
      }
    });
  } catch (error) {
    next(error);
  }
};

// Finalizar una sesión de participación
const completeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { participationCount, sessionDuration } = req.body;

    const session = await ParticipationSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    // Verificar que la sesión pertenece al docente
    if (session.teacherId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para finalizar esta sesión'
      });
    }

    // Actualizar datos finales si se proporcionan
    if (participationCount !== undefined) {
      session.participationCount = participationCount;
    }
    if (sessionDuration !== undefined) {
      session.sessionDuration = sessionDuration;
    }

    // Finalizar sesión
    await session.completeSession();

    res.json({
      success: true,
      message: 'Sesión finalizada',
      data: {
        session
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las sesiones del docente
const getMySessions = async (req, res, next) => {
  try {
    const { grade, section, status, page = 1, limit = 10 } = req.query;
    const teacherId = req.userId;

    const query = { teacherId };
    
    if (grade) {
      query.teacherGrade = grade;
    }
    
    if (section) {
      query.section = section;
    }
    
    if (status) {
      query.status = status;
    }

    // Calcular paginación
    const skip = (page - 1) * limit;

    // Obtener sesiones
    const sessions = await ParticipationSession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total
    const total = await ParticipationSession.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener una sesión específica
const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.userId;

    const session = await ParticipationSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    // Verificar que la sesión pertenece al docente
    if (session.teacherId.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta sesión'
      });
    }

    res.json({
      success: true,
      data: {
        session
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de participación
const getStatistics = async (req, res, next) => {
  try {
    const { grade, section } = req.query;
    const teacherId = req.userId;

    // Obtener todas las sesiones del docente
    const sessions = await ParticipationSession.find({
      teacherId,
      ...(grade && { teacherGrade: grade }),
      ...(section && { section })
    });

    // Calcular estadísticas
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalParticipations = sessions.reduce((sum, s) => sum + s.participationCount, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + s.sessionDuration, 0);
    const averageParticipations = totalSessions > 0 ? totalParticipations / totalSessions : 0;
    const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // Estadísticas por sección
    const statsBySection = sessions.reduce((acc, session) => {
      const sec = session.section;
      if (!acc[sec]) {
        acc[sec] = {
          section: sec,
          totalSessions: 0,
          totalParticipations: 0,
          totalDuration: 0
        };
      }
      acc[sec].totalSessions++;
      acc[sec].totalParticipations += session.participationCount;
      acc[sec].totalDuration += session.sessionDuration;
      return acc;
    }, {});

    // Calcular promedios por sección
    Object.keys(statsBySection).forEach(sec => {
      const stats = statsBySection[sec];
      stats.averageParticipations = stats.totalSessions > 0 
        ? stats.totalParticipations / stats.totalSessions 
        : 0;
      stats.averageDuration = stats.totalSessions > 0 
        ? stats.totalDuration / stats.totalSessions 
        : 0;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          activeSessions,
          completedSessions,
          totalParticipations,
          totalDuration,
          averageParticipations: Math.round(averageParticipations * 100) / 100,
          averageDuration: Math.round(averageDuration * 100) / 100
        },
        bySection: Object.values(statsBySection)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  updateSession,
  completeSession,
  getMySessions,
  getSession,
  getStatistics
};

