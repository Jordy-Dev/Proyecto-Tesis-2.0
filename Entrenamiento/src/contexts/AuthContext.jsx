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
        // Verificar que el usuario guardado sea de tipo teacher
        if (userData.userType !== 'teacher') {
          console.warn('⚠️ Usuario no es docente, cerrando sesión...')
          // Limpiar datos si el usuario no es docente
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          return
        }
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
      // Solo permitir login de docentes
      if (userType !== 'teacher') {
        throw new Error('Solo los docentes pueden acceder a esta aplicación')
      }

      const response = await apiService.login(email, password, userType)
      
      if (response.success) {
        const apiUser = response.data.user
        
        // Verificar que el usuario sea de tipo teacher
        if (apiUser.userType !== 'teacher') {
          throw new Error('Solo los docentes pueden acceder a esta aplicación')
        }
        
        setUser(apiUser)
        return apiUser
      } else {
        throw new Error(response.message || 'Error al iniciar sesión')
      }
    } catch (error) {
      console.error('Error en login:', error)
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

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

