const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
      console.error('Error en API:', error);
      
      // Si es un error de red, proporcionar un mensaje más útil
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.');
      }
      
      throw error;
    }
  }

  // Métodos de autenticación
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password, userType) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });

    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Métodos de documentos
  async uploadDocument(file, fileName, fileType, fileSize) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    formData.append('fileType', fileType);
    formData.append('fileSize', fileSize);

    const token = localStorage.getItem('token');

    const response = await fetch(`${this.baseURL}/documents/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // No establecer Content-Type manualmente para que el navegador
        // configure correctamente multipart/form-data con boundary
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al subir documento');
    }

    return data;
  }

  async getUserDocuments(page = 1, limit = 10, status = null) {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    
    return this.request(`/documents/my-documents?${params}`);
  }

  async getDocument(documentId) {
    return this.request(`/documents/${documentId}`);
  }

  async updateDocument(documentId, updateData) {
    return this.request(`/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteDocument(documentId) {
    return this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async processDocument(documentId) {
    return this.request(`/documents/${documentId}/process`, {
      method: 'POST',
    });
  }

  async getDocumentsByGrade(grade = null, section = null) {
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    if (section) params.append('section', section);
    
    return this.request(`/documents/by-grade?${params}`);
  }

  // Métodos de exámenes
  async createExam(examData) {
    return this.request('/exams/create', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  }

  async generateTempExam(payload) {
    return this.request('/exams/generate-temp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUserExams(page = 1, limit = 10, status = null) {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    
    return this.request(`/exams/my-exams?${params}`);
  }

  async getExamsByGrade(grade = null, section = null) {
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    if (section) params.append('section', section);
    
    return this.request(`/exams/by-grade?${params}`);
  }

  async getExam(examId) {
    return this.request(`/exams/${examId}`);
  }

  async startExam(examId) {
    return this.request(`/exams/${examId}/start`, {
      method: 'POST',
    });
  }

  async submitExam(examId, answers) {
    return this.request(`/exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getExamQuestions(examId) {
    return this.request(`/exams/${examId}/questions`);
  }

  async getExamResult(examId) {
    return this.request(`/exams/${examId}/result`);
  }

  // Métodos de usuarios (para docentes)
  async getStudents(grade = null, section = null) {
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    if (section) params.append('section', section);
    
    return this.request(`/users/students?${params}`);
  }

  async getStudent(studentId) {
    return this.request(`/users/students/${studentId}`);
  }

  async getStudentProgress(studentId) {
    return this.request(`/users/students/${studentId}/progress`);
  }

  async getStudentExams(studentId, page = 1, limit = 10) {
    const params = new URLSearchParams({ page, limit });
    return this.request(`/users/students/${studentId}/exams?${params}`);
  }

  async getStatistics() {
    return this.request('/users/statistics');
  }

  async getRanking(grade = null, section = null, limit = 10) {
    const params = new URLSearchParams({ limit });
    if (grade) params.append('grade', grade);
    if (section) params.append('section', section);
    
    return this.request(`/users/ranking?${params}`);
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Método para obtener el usuario actual
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Método para verificar la salud de la API
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
const apiService = new ApiService();

export default apiService;
