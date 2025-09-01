import { useMemo, useState } from 'react'

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [tagQuery, setTagQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minPopularity, setMinPopularity] = useState(0)

  const reports = [
    {
      id: 1,
      title: 'Monthly Sales Report',
      description: 'Comprehensive sales analysis for the current month',
      type: 'Sales',
      category: 'Sales',
      tags: ['revenue', 'monthly', 'store'],
      status: 'completed',
      popularity: 92,
      createdDate: '2024-01-15',
      size: '2.4 MB'
    },
    {
      id: 2,
      title: 'User Analytics Report',
      description: 'Detailed user behavior and engagement metrics',
      type: 'Analytics',
      category: 'Product',
      tags: ['engagement', 'cohort', 'funnel'],
      status: 'processing',
      popularity: 68,
      createdDate: '2024-01-14',
      size: '1.8 MB'
    },
    {
      id: 3,
      title: 'Financial Summary Q4',
      description: 'Quarterly financial performance summary',
      type: 'Financial',
      category: 'Finance',
      tags: ['q4', 'pnl', 'balance-sheet'],
      status: 'completed',
      popularity: 80,
      createdDate: '2024-01-10',
      size: '3.2 MB'
    }
  ]

  const categories = Array.from(new Set(reports.map(r => r.category)))

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const text = `${report.title} ${report.description} ${report.tags.join(' ')}`.toLowerCase()
      const matchesText = text.includes(searchTerm.toLowerCase())
      const matchesCategory = category === 'all' || report.category === category
      const matchesStatus = status === 'all' || report.status === status
      const matchesTag = !tagQuery || report.tags.some(t => t.toLowerCase().includes(tagQuery.toLowerCase()))
      const created = new Date(report.createdDate)
      const afterStart = !startDate || created >= new Date(startDate)
      const beforeEnd = !endDate || created <= new Date(endDate)
      const matchesPopularity = (report.popularity || 0) >= Number(minPopularity)
      return matchesText && matchesCategory && matchesStatus && matchesTag && afterStart && beforeEnd && matchesPopularity
    })
  }, [reports, searchTerm, category, status, tagQuery, startDate, endDate, minPopularity])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Generate Report
        </button>
      </div>

      <div className="bg-white border rounded p-4 mb-4 grid gap-3 md:grid-cols-6">
        <input
          type="text"
          placeholder="Full-text search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
        />
        <select className="px-3 py-2 border rounded" value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="px-3 py-2 border rounded" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
        </select>
        <input
          type="text"
          placeholder="Filter tags (e.g. revenue)"
          value={tagQuery}
          onChange={e=>setTagQuery(e.target.value)}
          className="px-3 py-2 border rounded"
        />
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="px-3 py-2 border rounded w-full" />
          <span className="text-gray-400">to</span>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div className="md:col-span-6 flex items-center gap-3">
          <label className="text-sm text-gray-600">Min popularity: {minPopularity}</label>
          <input type="range" min="0" max="100" value={minPopularity} onChange={e=>setMinPopularity(e.target.value)} className="w-64" />
          <span className="text-sm text-gray-500">{filteredReports.length} results</span>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white border rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{report.title}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                report.status === 'completed' ? 'bg-green-100 text-green-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {report.status}
              </span>
            </div>
            <p className="text-gray-600 mb-3">{report.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{report.category} • {report.createdDate} • {report.size} • Popularity {report.popularity}</span>
              <div className="space-x-2">
                <button className="text-blue-600 hover:text-blue-800">Download</button>
                <button className="text-green-600 hover:text-green-800">View</button>
                <button className="text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.tags.map(t => (
                <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">#{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reports
