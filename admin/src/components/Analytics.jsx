const Analytics = () => {
  const metrics = [
    { name: 'Page Views', value: '125,430' },
    { name: 'Unique Visitors', value: '45,678' },
    { name: 'Bounce Rate', value: '32.5%' },
    { name: 'Avg. Session', value: '4m 32s' }
  ]

  const topPages = [
    { page: '/dashboard', views: 12543 },
    { page: '/users', views: 8921 },
    { page: '/analytics', views: 6754 },
    { page: '/settings', views: 4532 },
    { page: '/reports', views: 3421 }
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-white border rounded p-4">
            <h3 className="text-sm text-gray-600 mb-1">{metric.name}</h3>
            <p className="text-xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Top Pages */}
      <div className="bg-white border rounded">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Top Pages</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div key={page.page} className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">{page.page}</p>
                  <p className="text-sm text-gray-600">Page {index + 1}</p>
                </div>
                <span className="font-semibold">{page.views.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
