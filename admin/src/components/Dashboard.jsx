import { useState, useEffect, useRef } from 'react'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { Users, ShoppingCart, Activity, TrendingUp, Clock, LogIn, LogOut } from 'lucide-react'
import io from 'socket.io-client'

const Dashboard = () => {
  const [stats, setStats] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [newActivityCount, setNewActivityCount] = useState(0)
  const { user, hasPermission } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    loadDashboardData()

    // Setup Socket.IO connection for admin users only
    if (['admin', 'super_admin'].includes(user?.role)) {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      socketRef.current = io(API_BASE, {
        transports: ['websocket', 'polling']
      })

      socketRef.current.on('connect', () => {
        console.log('✅ Connected to Socket.IO server')
      })

      socketRef.current.on('user:login', (data) => {
        console.log('🔵 New login event:', data)
        setRecentActivities(prev => [data, ...prev])
        setNewActivityCount(prev => prev + 1)
      })

      socketRef.current.on('user:logout', (data) => {
        console.log('🔴 New logout event:', data)
        setRecentActivities(prev => [data, ...prev])
        setNewActivityCount(prev => prev + 1)
      })

      socketRef.current.on('disconnect', () => {
        console.log('❌ Disconnected from Socket.IO server')
      })
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Simple stats for all users
      const statsData = [
        {
          name: 'Welcome',
          value: user?.name || 'User',
          icon: Activity,
          color: 'primary'
        },
        {
          name: 'Role',
          value: user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
          icon: Users,
          color: 'success'
        }
      ]

      // Add role-specific stats
      if (user.role === 'super_admin') {
        try {
          const [users, orders] = await Promise.all([
            api.getUsers({ limit: 1 }),
            api.getOrders({ limit: 1 })
          ])
          statsData.push(
            {
              name: 'Total Users',
              value: users.total || 0,
              icon: Users,
              color: 'warning'
            },
            {
              name: 'Total Orders',
              value: orders.total || 0,
              icon: ShoppingCart,
              color: 'danger'
            }
          )
        } catch (error) {
          console.error('Super Admin stats error:', error)
        }
      } else if (user.role === 'admin') {
        try {
          const orders = await api.getOrders({ limit: 1 })
          statsData.push(
            {
              name: 'Total Orders',
              value: orders.total || 0,
              icon: ShoppingCart,
              color: 'warning'
            },
            {
              name: 'Content Access',
              value: 'Full',
              icon: TrendingUp,
              color: 'success'
            }
          )
        } catch (error) {
          console.error('Admin stats error:', error)
        }
      } else if (user.role === 'editor') {
        const permissions = user.permissions || {}
        const accessList = []
        if (permissions.reports?.view) accessList.push('Reports')
        if (permissions.posts?.view) accessList.push('Blog/News')
        if (permissions.users?.view) accessList.push('Users')

        statsData.push(
          {
            name: 'Access Level',
            value: 'Editor',
            icon: Activity,
            color: 'primary'
          },
          {
            name: 'Modules',
            value: accessList.join(', ') || 'None',
            icon: TrendingUp,
            color: 'warning'
          }
        )
      }

      setStats(statsData)

      // Fetch login history for admins
      if (['admin', 'super_admin'].includes(user.role)) {
        try {
          const history = await api.getLoginHistory({})
          setRecentActivities(history)
        } catch (e) {
          console.error('Failed to fetch login history', e)
        }
      } else {
        // Fallback for non-admins (or just show own login)
        setRecentActivities([
          {
            id: '1',
            user: user?.name || 'User',
            action: 'Logged into dashboard',
            time: new Date().toISOString(),
            type: 'login',
            role: user.role,
            email: user.email,
            ip: 'Current'
          }
        ])
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGradientClass = (color) => {
    const gradients = {
      primary: 'from-blue-600 to-blue-500',
      success: 'from-green-600 to-green-500',
      warning: 'from-amber-600 to-amber-500',
      danger: 'from-red-600 to-red-500'
    }
    return gradients[color] || gradients.primary
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className={`
                stat-card bg-gradient-to-br ${getGradientClass(stat.color)}
                animate-fadeIn
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/80 mb-1">{stat.name}</h3>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center text-white/80 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Active</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="card animate-fadeIn" style={{ animationDelay: '400ms' }}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Login History
                  {newActivityCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                      {newActivityCount} new
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">
                  Real-time user activity
                  {newActivityCount > 0 && (
                    <button
                      onClick={() => setNewActivityCount(0)}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      Clear notifications
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentActivities.map((activity, idx) => (
                      <tr key={activity.id || idx} className={idx < newActivityCount ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {(activity.user?.name || activity.user?.email || activity.user || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{activity.user?.name || activity.user || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${activity.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : activity.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {activity.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activity.action === 'logout' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <LogOut className="w-3 h-3 mr-1" />
                              Logout
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <LogIn className="w-3 h-3 mr-1" />
                              Login
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.time || activity.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.ip}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No login history found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
