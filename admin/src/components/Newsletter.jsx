import { useState, useEffect } from 'react'
import { Search, Download, UserPlus, Trash2 } from 'lucide-react'
import api from '../utils/api'

const Newsletter = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSubscribers()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSubscribers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  const loadSubscribers = async () => {
    try {
      setLoading(true)
      const params = { q: searchTerm }
      if (statusFilter !== 'all') params.status = statusFilter
      const result = await api.getSubscribers(params)
      setSubscribers(result.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || sub.status === statusFilter)
  )

  const addSubscriber = () => {
    // implement add subscriber logic here
  }

  const removeSubscriber = (id) => {
    // implement remove subscriber logic here
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center"><Search className="w-6 h-6 mr-2"/>Newsletter</h1>
        <button onClick={loadSubscribers} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm inline-flex items-center"><Download className="w-4 h-4 mr-2"/>Refresh</button>
      </div>

      <div className="bg-white border rounded p-4 mb-4 grid md:grid-cols-3 gap-3">
        <div className="flex">
          <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search subscribers" className="flex-1 px-3 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={addSubscriber} className="px-3 bg-green-600 text-white rounded-r hover:bg-green-700 inline-flex items-center"><UserPlus className="w-4 h-4"/></button>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <div className="text-sm text-gray-500 flex items-center">{filteredSubscribers.length} of {subscribers.length} subscribers</div>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Email</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-left p-3 font-semibold">Source</th>
              <th className="text-left p-3 font-semibold">Subscribed</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map(sub => (
              <tr key={sub._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{sub.name || 'N/A'}</td>
                <td className="px-4 py-3">{sub.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    sub.status === 'subscribed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{sub.source || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(sub.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeSubscriber(sub._id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center"><Trash2 className="w-3.5 h-3.5 mr-1"/>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 text-blue-800 rounded p-4 text-sm">
        <p className="font-semibold mb-1">Optional integration</p>
        <p>Connect Mailchimp or a similar service via their SDK/API to sync subscribers and send campaigns.</p>
      </div>
    </div>
  )
}

export default Newsletter
