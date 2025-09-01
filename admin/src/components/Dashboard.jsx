const Dashboard = () => {
  const stats = [
    { name: 'Total Users', value: '12,345' },
    { name: 'Revenue', value: '$45,678' },
    { name: 'Orders', value: '1,234' },
    { name: 'Growth', value: '23.5%' }
  ]

  const recentActivities = [
    { id: 1, user: 'John Smith', action: 'Created new account', time: '2 minutes ago' },
    { id: 2, user: 'Sarah Johnson', action: 'Made a purchase', time: '5 minutes ago' },
    { id: 3, user: 'Mike Wilson', action: 'Updated profile', time: '10 minutes ago' },
    { id: 4, user: 'Emma Davis', action: 'Left a review', time: '15 minutes ago' },
    { id: 5, user: 'Alex Brown', action: 'Subscribed to newsletter', time: '20 minutes ago' }
  ]

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
