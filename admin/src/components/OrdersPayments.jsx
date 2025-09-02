import { useState, useEffect } from 'react'
import { Search, Filter, Eye, Download, DollarSign, RefreshCcw, Clock, XCircle } from 'lucide-react'
import api from '../utils/api'

const OrdersPayments = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = { q: searchTerm }
      if (statusFilter !== 'all') params.status = statusFilter
      const result = await api.getOrders(params)
      setOrders(result.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = [order.orderId, order.customerName, order.customerEmail].some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusBadge = (status) => {
    const base = 'inline-flex items-center px-2 py-1 text-xs rounded'
    if (status === 'paid') return <span className={`${base} bg-green-100 text-green-700`}><DollarSign className="w-3.5 h-3.5 mr-1"/>Paid</span>
    if (status === 'pending') return <span className={`${base} bg-yellow-100 text-yellow-800`}><Clock className="w-3.5 h-3.5 mr-1"/>Pending</span>
    return <span className={`${base} bg-red-100 text-red-700`}><XCircle className="w-3.5 h-3.5 mr-1"/>Failed</span>
  }

  const simulateCapture = (id) => {
    setOrders(prev => prev.map(order => order._id === id ? { ...order, status: 'paid' } : order))
  }

  const simulateRefund = (id) => {
    setOrders(prev => prev.map(order => order._id === id ? { ...order, status: 'pending' } : order))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center"><DollarSign className="w-6 h-6 mr-2"/>Orders & Payments</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
          <RefreshCcw className="w-4 h-4 mr-2"/>Refresh
        </button>
      </div>

      <div className="bg-white border rounded p-4 mb-4">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by Order ID or Customer"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select className="px-3 py-2 border rounded" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center">{filteredOrders.length} of {orders.length} orders</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-semibold">Order ID</th>
              <th className="text-left p-3 font-semibold">Customer</th>
              <th className="text-left p-3 font-semibold">Customer Email</th>
              <th className="text-left p-3 font-semibold">Amount</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{order.orderId || order._id}</td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="px-4 py-3 text-gray-600">{order.customerEmail}</td>
                <td className="px-4 py-3 font-medium">${order.amount}</td>
                <td className="p-3">{statusBadge(order.status)}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => simulateCapture(order._id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Capture</button>
                  <button onClick={() => simulateRefund(order._id)} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700">Mark Pending</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-500 mb-1">Paid</div>
          <div className="text-2xl font-bold">{orders.filter(o => o.status === 'paid').length}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-sm text-gray-500 mb-1">Failed</div>
          <div className="text-2xl font-bold">{orders.filter(o => o.status === 'failed').length}</div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 text-blue-800 rounded p-4 text-sm">
        <p className="font-semibold mb-1">Frontend-only note</p>
        <p>This page simulates PayPal/Stripe flows. Replace actions with real SDK/API calls when backend is available.</p>
      </div>
    </div>
  )
}

export default OrdersPayments
