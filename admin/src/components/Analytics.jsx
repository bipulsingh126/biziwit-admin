import { useState, useEffect } from 'react'
import api from '../utils/api'

const Analytics = () => {
  const [metrics, setMetrics] = useState([])
  const [topPages, setTopPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load analytics data from API
      const analyticsData = await api.getAnalytics({ range: dateRange })
      
      setMetrics(analyticsData.metrics || [])
      setTopPages(analyticsData.topPages || [])
    } catch (err) {
      setError(err.message)
      setMetrics([])
      setTopPages([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-4">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button 
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-6">
          <div className="flex items-center justify-between">
            <span>❌ Failed to load analytics data: {error}</span>
            <button onClick={loadAnalytics} className="text-sm underline hover:no-underline">
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.length === 0 && !error ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>No analytics data available</p>
          </div>
        ) : (
          metrics.map((metric) => (
            <div key={metric.name} className="bg-white border rounded p-4 hover:shadow-md transition-shadow">
              <h3 className="text-sm text-gray-600 mb-1">{metric.name}</h3>
              <div className="flex items-center justify-between">
                <p className="text-xl font-semibold">{metric.value}</p>
                {metric.change && (
                  <span className={`text-sm px-2 py-1 rounded ${
                    metric.change.startsWith('+') ? 'bg-green-100 text-green-800' : 
                    metric.change.startsWith('-') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {metric.change}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Top Pages */}
      <div className="bg-white border rounded shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Top Pages</h3>
        </div>
        <div className="p-4">
          {topPages.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No page data available</p>
          ) : (
            <div className="space-y-3">
              {topPages.map((page, index) => (
                <div key={page.page} className="flex justify-between items-center py-2 hover:bg-gray-50 rounded px-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{page.page}</p>
                      <p className="text-sm text-gray-600">{page.views.toLocaleString()} views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {page.change && (
                      <span className={`text-sm px-2 py-1 rounded ${
                        page.change.startsWith('+') ? 'bg-green-100 text-green-800' : 
                        page.change.startsWith('-') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {page.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
