import { createContext, useContext, useState, useEffect } from 'react'
import apiService from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        console.error('Error al parsear usuario guardado:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (email, password, userType) => {
    try {
      const response = await apiService.login(email, password, userType)
      
      if (response.success) {
        setUser(response.data.user)
        return response.data.user
      } else {
        throw new Error(response.message || 'Error al iniciar sesión')
      }
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData)
      
      if (response.success) {
        setUser(response.data.user)
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response.data.user
      } else {
        throw new Error(response.message || 'Error al registrar usuario')
      }
    } catch (error) {
      console.error('Error en registro:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData)
      
      if (response.success) {
        setUser(response.data.user)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response.data.user
      } else {
        throw new Error(response.message || 'Error al actualizar perfil')
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      throw error
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await apiService.changePassword(currentPassword, newPassword)
      
      if (response.success) {
        return true
      } else {
        throw new Error(response.message || 'Error al cambiar contraseña')
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      throw error
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}