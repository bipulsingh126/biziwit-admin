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
    localStorage.removeItem('token')
    api.setToken(null)
  }

  const hasPermission = (module, action) => {
    if (!user) return false
    
    // Super Admin has access to everything
    if (user.role === 'super_admin') return true
    
    // Regular Admin has access to everything except user management
    if (user.role === 'admin') {
      if (module === 'users') return false
      return true
    }
    
    // Editor role: check specific permissions
    if (user.role === 'editor') {
      return user.permissions?.[module]?.[action] || false
    }
    
    return false
  }

  const canAccessRoute = (route) => {
    if (!user) return false
    
    // Super Admin can access all routes
    if (user.role === 'super_admin') return true
    
    // Regular Admin can access all routes except users
    if (user.role === 'admin') {
      if (route === '/users') return false
      return true
    }
    
    // Editor role: check based on permissions
    if (user.role === 'editor') {
      if (route === '/reports' && hasPermission('reports', 'view')) return true
      if ((route === '/blog' || route === '/news') && hasPermission('posts', 'view')) return true
      if (route === '/users' && hasPermission('users', 'view')) return true
      if (route === '/analytics' && hasPermission('analytics', 'view')) return true
      if (route === '/home-page-management' && hasPermission('content', 'edit')) return true
      if (route === '/dashboard') return true
      return false
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
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
