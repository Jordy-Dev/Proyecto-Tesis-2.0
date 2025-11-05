import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ========================================
// CONFIGURACIÓN DE URL DE LA API
// ========================================
// IMPORTANTE: Si estás usando un DISPOSITIVO FÍSICO Android, cambia USE_PHYSICAL_DEVICE a true
// y configura tu IP local en LOCAL_IP
//
// Para obtener tu IP local:
//   - Windows: Abre CMD y ejecuta: ipconfig (busca "IPv4 Address")
//   - Mac/Linux: Abre Terminal y ejecuta: ifconfig (busca "inet")
//
// Configuraciones:
//   - Emulador Android: USE_PHYSICAL_DEVICE = false (usa 10.0.2.2)
//   - Dispositivo físico Android: USE_PHYSICAL_DEVICE = true (usa LOCAL_IP)
//   - iOS Simulator: No cambies nada (usa localhost)
//   - Web: No cambies nada (usa localhost)
// ========================================
const USE_PHYSICAL_DEVICE = true; // ⚠️ CAMBIA A true SI USAS DISPOSITIVO FÍSICO ANDROID
const LOCAL_IP = '192.168.1.65'; // Tu IP local (solo necesario si USE_PHYSICAL_DEVICE = true)

// Función para obtener la URL base de la API según la plataforma
const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // En desarrollo
    if (Platform.OS === 'android') {
      // Emulador Android usa 10.0.2.2 para acceder al localhost de la máquina host
      // Dispositivo físico Android necesita la IP local de tu máquina
      if (USE_PHYSICAL_DEVICE) {
        return `http://${LOCAL_IP}:3001/api`;
      }
      return `http://10.0.2.2:3001/api`;
    } else if (Platform.OS === 'ios') {
      // iOS Simulator puede usar localhost
      return `http://localhost:3001/api`;
    } else {
      // Web
      return `http://localhost:3001/api`;
    }
  } else {
    // En producción, usar la URL real del servidor
    return `https://tu-servidor.com/api`;
  }
};

const API_BASE_URL = getApiBaseUrl();

// Log para debugging (solo en desarrollo)
if (__DEV__) {
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('📱 Platform:', Platform.OS);
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      _id: string;
      name: string;
      email: string;
      userType: string;
    };
    token: string;
  };
}

class ApiService {
  private baseURL: string;

  constructor() {
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
        ...(token && { Authorization: `Bearer ${token}` }),
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
        // Si no es JSON, usar el texto de la respuesta
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
      console.error(`🔧 USE_PHYSICAL_DEVICE: ${USE_PHYSICAL_DEVICE}`);
      console.error(`🌐 LOCAL_IP: ${LOCAL_IP}`);

      // Si es un error de red, proporcionar un mensaje más útil
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Network request failed'))) {
        let errorMessage = 'No se pudo conectar con el servidor.\n\n';
        errorMessage += `Intentando conectar a: ${url}\n\n`;
        errorMessage += 'Verifica:\n';
        errorMessage += '1. Que la API esté ejecutándose en el puerto 3001\n';
        if (Platform.OS === 'android') {
          if (USE_PHYSICAL_DEVICE) {
            errorMessage += `2. Que tu IP local sea correcta: ${LOCAL_IP}\n`;
            errorMessage += '3. Que el dispositivo y la computadora estén en la misma red WiFi\n';
            errorMessage += '4. Que el firewall permita conexiones en el puerto 3001\n';
          } else {
            errorMessage += '2. Si estás usando un emulador, intenta con dispositivo físico\n';
            errorMessage += '3. Si estás usando dispositivo físico, cambia USE_PHYSICAL_DEVICE a true\n';
            errorMessage += `4. Verifica que 10.0.2.2 sea accesible desde el emulador\n`;
          }
        }
        throw new Error(errorMessage);
      }

      throw error;
    }
  }

  // Métodos de autenticación
  async login(
    email: string,
    password: string,
    userType: string = 'student'
  ): Promise<LoginResponse> {
    console.log('🔐 Iniciando login...');
    try {
      const response = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, userType }),
      });

      if (response.success && response.data?.token) {
        console.log('✅ Login exitoso, guardando token...');
        await SecureStore.setItemAsync(
          'auth_token',
          response.data.token
        );
        await SecureStore.setItemAsync(
          'user_data',
          JSON.stringify(response.data.user)
        );
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

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Método para verificar si el usuario está autenticado
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('auth_token');
    const userData = await SecureStore.getItemAsync('user_data');
    return !!(token && userData);
  }

  // Método para obtener el usuario actual
  async getCurrentUser(): Promise<any | null> {
    const userData = await SecureStore.getItemAsync('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}

// Crear instancia única del servicio
const apiService = new ApiService();

export default apiService;

