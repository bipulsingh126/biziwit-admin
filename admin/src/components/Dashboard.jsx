import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { Users, ShoppingCart, Activity, TrendingUp, Clock } from 'lucide-react'

const Dashboard = () => {
  const [stats, setStats] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    loadDashboardData()
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
      setRecentActivities([
        {
          id: '1',
          user: user?.name || 'User',
          action: 'Logged into dashboard',
          time: new Date().toLocaleString(),
          type: 'login'
        }
      ])
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
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-500">Your latest actions</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {activity.user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.user}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">{activity.time}</span>
                  <div className="mt-1">
                    <span className="badge badge-success">Success</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
