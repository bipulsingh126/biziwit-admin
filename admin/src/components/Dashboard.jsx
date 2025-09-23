import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

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
        { name: 'Welcome', value: user?.name || 'User' },
        { name: 'Role', value: user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown' }
      ]

      // Add role-specific stats
      if (user.role === 'super_admin') {
        try {
          const [users, orders] = await Promise.all([
            api.getUsers({ limit: 1 }),
            api.getOrders({ limit: 1 })
          ])
          statsData.push(
            { name: 'Total Users', value: users.total || 0 },
            { name: 'Total Orders', value: orders.total || 0 }
          )
        } catch (error) {
          console.error('Super Admin stats error:', error)
        }
      } else if (user.role === 'admin') {
        try {
          const orders = await api.getOrders({ limit: 1 })
          statsData.push(
            { name: 'Total Orders', value: orders.total || 0 },
            { name: 'Content Access', value: 'Full' }
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
          { name: 'Access Level', value: 'Editor' },
          { name: 'Modules', value: accessList.join(', ') || 'None' }
        )
      }

      setStats(statsData)
      setRecentActivities([
        {
          id: '1',
          user: user?.name || 'User',
          action: 'Logged into dashboard',
          time: new Date().toLocaleString()
        }
      ])
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white border rounded p-4">
            <h3 className="text-sm text-gray-600 mb-1">{stat.name}</h3>
            <p className="text-xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border rounded">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">{activity.user}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
