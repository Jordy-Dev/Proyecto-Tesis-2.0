import { AuthContextType, LoginCredentials, User } from '@/types';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import apiService from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userData = await SecureStore.getItemAsync('user_data');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        
        // Verificar que el usuario guardado sea de tipo teacher
        if (parsedUser.userType !== 'teacher') {
          console.warn('⚠️ Usuario no es docente, cerrando sesión...');
          // Limpiar datos si el usuario no es docente
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_data');
          return;
        }
        
        // Asegurar que el usuario tenga el formato correcto
        const user: User = {
          id: parsedUser._id || parsedUser.id,
          email: parsedUser.email,
          name: parsedUser.name,
          grade: parsedUser.grade,
        };
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Solo permitir login de docentes (teachers)
      const response = await apiService.login(
        credentials.email,
        credentials.password,
        'teacher' // Solo docentes pueden acceder a iot-movil
      );
      
      if (response.success && response.data) {
        const apiUser = response.data.user;
        
        // Verificar que el usuario sea de tipo teacher
        if (apiUser.userType !== 'teacher') {
          console.error('❌ Acceso denegado: Solo los docentes pueden acceder a esta aplicación');
          return false;
        }
        
        // Convertir el usuario de la API al formato esperado
        const userData: User = {
          id: apiUser._id,
          email: apiUser.email,
          name: apiUser.name,
          grade: apiUser.grade,
        };
        
        setUser(userData);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Asegurar que se limpien los datos locales aunque falle la API
      try {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_data');
        setUser(null);
      } catch (cleanupError) {
        console.error('Error durante limpieza:', cleanupError);
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};




