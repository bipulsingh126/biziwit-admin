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

  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')

  const addSubscriber = async () => {
    if (!newEmail.trim()) return
    try {
      await api.addSubscriber({ email: newEmail.trim(), name: newName.trim() || undefined })
      setNewEmail('')
      setNewName('')
      setShowAddModal(false)
      loadSubscribers()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeSubscriber = async (id) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) return
    try {
      await api.removeSubscriber(id)
      setSubscribers(prev => prev.filter(s => s._id !== id))
    } catch (err) {
      setError(err.message)
    }
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
          <button onClick={() => setShowAddModal(true)} className="px-3 bg-green-600 text-white rounded-r hover:bg-green-700 inline-flex items-center"><UserPlus className="w-4 h-4"/></button>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <div className="text-sm text-gray-500 flex items-center">{filteredSubscribers.length} of {subscribers.length} subscribers</div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscribers...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-4">
          Error: {error}
          <button onClick={loadSubscribers} className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm">Retry</button>
        </div>
      )}

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

      {filteredSubscribers.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>No subscribers found</p>
        </div>
      )}

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Subscriber</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="subscriber@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (Optional)</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={addSubscriber} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={!newEmail.trim()}>Add Subscriber</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Newsletter
