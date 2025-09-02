import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          api.setToken(token)
          const result = await api.getMe()
          setUser(result.user)
        }
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem('token')
        api.setToken(null)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const result = await api.login(email, password)
      setUser(result.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      // Ignore logout errors
    }
    setUser(null)
    api.setToken(null)
  }

  const hasPermission = (module, action) => {
    if (!user) return false
    
    // Admin has access to everything
    if (user.role === 'admin') return true
    
    // Editor role: only allow reports and posts (blog/news)
    if (user.role === 'editor') {
      if (module === 'reports' || module === 'posts') {
        return user.permissions?.[module]?.[action] || true // Default true for editor's allowed modules
      }
      return false // Deny access to all other modules
    }
    
    return false
  }

  const canAccessRoute = (route) => {
    if (!user) return false
    
    // Admin can access all routes
    if (user.role === 'admin') return true
    
    // Editor role: only allow access to reports, blog, and news
    if (user.role === 'editor') {
      const allowedRoutes = ['/reports', '/blog', '/news']
      return allowedRoutes.includes(route)
    }
    
    return false
  }

  const value = {
    user,
    login,
    logout,
    loading,
    hasPermission,
    canAccessRoute,
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
