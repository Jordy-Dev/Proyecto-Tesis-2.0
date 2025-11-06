const PARTICIPATION_API_BASE_URL = 'http://localhost:3002/api';

class ParticipationApiService {
  constructor() {
    this.baseURL = PARTICIPATION_API_BASE_URL;
  }

  // Método genérico para hacer peticiones HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Verificar si la respuesta es JSON válida
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Error parseando JSON:', jsonError);
          throw new Error('Respuesta inválida del servidor');
        }
      } else {
        // Si no es JSON, usar el texto de la respuesta
        const text = await response.text();
        throw new Error(text || 'Error en la petición');
      }

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error en API de participación:', error);
      
      // Si es un error de red, proporcionar un mensaje más útil
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor de participación. Verifica que la API esté ejecutándose en el puerto 3002.');
      }
      
      throw error;
    }
  }

  // Crear una nueva sesión de participación
  async createSession(teacherName, teacherGrade, section) {
    const response = await this.request('/participation/sessions', {
      method: 'POST',
      body: JSON.stringify({
        teacherName,
        teacherGrade,
        section,
      }),
    });

    return response.data.session;
  }

  // Actualizar una sesión activa
  async updateSession(sessionId, participationCount, sessionDuration) {
    const response = await this.request(`/participation/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        participationCount,
        sessionDuration,
      }),
    });

    return response.data.session;
  }

  // Finalizar una sesión
  async completeSession(sessionId, participationCount, sessionDuration) {
    const response = await this.request(`/participation/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        participationCount,
        sessionDuration,
      }),
    });

    return response.data.session;
  }

  // Obtener todas las sesiones del docente
  async getMySessions(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.grade) queryParams.append('grade', filters.grade);
    if (filters.section) queryParams.append('section', filters.section);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const queryString = queryParams.toString();
    const endpoint = `/participation/sessions${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request(endpoint);
    return response.data;
  }

  // Obtener una sesión específica
  async getSession(sessionId) {
    const response = await this.request(`/participation/sessions/${sessionId}`);
    return response.data.session;
  }

  // Obtener estadísticas de participación
  async getStatistics(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.grade) queryParams.append('grade', filters.grade);
    if (filters.section) queryParams.append('section', filters.section);

    const queryString = queryParams.toString();
    const endpoint = `/participation/statistics${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request(endpoint);
    return response.data;
  }

  // Verificar la salud de la API
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error en health check:', error);
      return false;
    }
  }
}

// Crear instancia única del servicio
const participationApiService = new ParticipationApiService();

export default participationApiService;

