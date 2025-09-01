import { createContext, useContext, useState, useEffect } from 'react'

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

  // Mock users for demo purposes
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      name: 'John Doe',
      email: 'admin@biziwit.com',
      role: 'admin',
      avatar: 'JD'
    },
    {
      id: 2,
      username: 'editor',
      password: 'editor123',
      name: 'Jane Smith',
      email: 'editor@biziwit.com',
      role: 'editor',
      avatar: 'JS'
    }
  ]

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const uname = (username || '').trim()
      const pwd = (password || '').trim()
      const foundUser = mockUsers.find(
        u => u.username === uname && u.password === pwd
      )
      
      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)
        localStorage.setItem('user', JSON.stringify(userWithoutPassword))
        return { success: true }
      } else {
        return { success: false, error: 'Invalid username or password' }
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const hasPermission = (requiredRole) => {
    if (!user) return false
    
    // Admin has access to everything
    if (user.role === 'admin') return true
    
    // Editor has limited access
    if (user.role === 'editor') {
      return ['reports', 'blog', 'news'].includes(requiredRole)
    }
    
    return false
  }

  const canAccessRoute = (route) => {
    if (!user) return false
    
    // Admin can access all routes
    if (user.role === 'admin') return true
    
    // Editor can only access specific routes
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
