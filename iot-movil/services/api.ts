import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// Define la estructura de la respuesta del login
export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      _id: string;
      name: string;
      email: string;
      userType: string;
      grade: string;
      section?: string;
    };
    token: string;
  };
}

// Clase principal para manejar las peticiones API
class ApiService {
  private baseURL: string;

  constructor() {
    // Usamos la misma URL base que la app de referencia
    this.baseURL = API_BASE_URL;
  }

  // Método genérico para hacer peticiones HTTP
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await SecureStore.getItemAsync('auth_token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),  // Incluimos el token de autorización si está presente
        ...options.headers,
      },
      ...options,
    };

    console.log(`📡 Intentando conectar a: ${url}`);
    console.log(`📋 Método: ${options.method || 'GET'}`);

    try {
      const response = await fetch(url, config);
      console.log(`✅ Respuesta recibida: ${response.status} ${response.statusText}`);

      // Verificar si la respuesta es JSON válida
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('❌ Error parseando JSON:', jsonError);
          throw new Error('Respuesta inválida del servidor');
        }
      } else {
        // Si no es JSON, intentamos leer el texto de la respuesta
        const text = await response.text();
        throw new Error(text || 'Error en la petición');
      }

      if (!response.ok) {
        const errorData = data as any;
        throw new Error(
          errorData.message || `Error ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error en API:', error);
      console.error(`🔗 URL que falló: ${url}`);
      console.error(`📱 Platform: ${Platform.OS}`);
      console.error(`🌐 API_BASE_URL: ${this.baseURL}`);

      // Si es un error de red, proporcionar un mensaje más útil
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Network request failed'))) {
        let errorMessage = 'No se pudo conectar con el servidor.\n\n';
        errorMessage += `Intentando conectar a: ${url}\n\n`;
        errorMessage += 'Verifica:\n';
        errorMessage += '1. Que la API esté ejecutándose y sea accesible\n';
        errorMessage += `2. URL objetivo: ${this.baseURL}\n`;
        throw new Error(errorMessage);
      }

      throw error;
    }
  }

  // Método de autenticación - login
  async login(
    email: string,
    password: string,
    userType: string = 'student'
  ): Promise<LoginResponse> {
    console.log('🔐 Iniciando login...');
    try {
      const response = await this.request<LoginResponse>(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password, userType }),
      });

      if (response.success && response.data?.token) {
        console.log('✅ Login exitoso, guardando token...');
        await SecureStore.setItemAsync('auth_token', response.data.token);
        await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
        console.log('✅ Token guardado correctamente');
      } else {
        console.warn('⚠️ Login exitoso pero sin token');
      }

      return response;
    } catch (error: any) {
      console.error('❌ Error en login:', error.message);
      throw error;
    }
  }

  // Método de autenticación - logout
  async logout(): Promise<void> {
    try {
      await this.request(API_ENDPOINTS.LOGOUT, { method: 'POST' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
    }
  }

  // Obtener el perfil del usuario autenticado
  async getProfile() {
    return this.request(API_ENDPOINTS.PROFILE);
  }

  // Método para verificar si el usuario está autenticado
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('auth_token');
    const userData = await SecureStore.getItemAsync('user_data');
    return !!(token && userData);  // Si hay token y datos del usuario, se considera autenticado
  }

  // Método para obtener el usuario actual
  async getCurrentUser(): Promise<any | null> {
    const userData = await SecureStore.getItemAsync('user_data');
    return userData ? JSON.parse(userData) : null;  // Devuelve los datos del usuario, si están almacenados
  }
}

// Crear instancia única del servicio
const apiService = new ApiService();

// Exportamos la instancia para usarla en el resto de la app
export default apiService;
