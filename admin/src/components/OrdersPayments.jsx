import { useMemo, useState } from 'react'
import { CreditCard, CheckCircle2, Clock, XCircle, RefreshCcw } from 'lucide-react'

const sampleOrders = [
  { id: 'ORD-1001', customer: 'Alice Johnson', amount: 129.99, method: 'Stripe', status: 'paid', createdAt: '2025-08-24 10:14' },
  { id: 'ORD-1002', customer: 'Bob Smith', amount: 59.0, method: 'PayPal', status: 'pending', createdAt: '2025-08-26 09:42' },
  { id: 'ORD-1003', customer: 'Charlie Davis', amount: 249.49, method: 'Stripe', status: 'failed', createdAt: '2025-08-27 13:22' },
  { id: 'ORD-1004', customer: 'Diana Prince', amount: 19.99, method: 'PayPal', status: 'paid', createdAt: '2025-08-28 17:05' },
]

const statusBadge = (status) => {
  const base = 'inline-flex items-center px-2 py-1 text-xs rounded'
  if (status === 'paid') return <span className={`${base} bg-green-100 text-green-700`}><CheckCircle2 className="w-3.5 h-3.5 mr-1"/>Paid</span>
  if (status === 'pending') return <span className={`${base} bg-yellow-100 text-yellow-800`}><Clock className="w-3.5 h-3.5 mr-1"/>Pending</span>
  return <span className={`${base} bg-red-100 text-red-700`}><XCircle className="w-3.5 h-3.5 mr-1"/>Failed</span>
}

const OrdersPayments = () => {
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('all')
  const [status, setStatus] = useState('all')
  const [orders, setOrders] = useState(sampleOrders)

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = [o.id, o.customer].some(v => v.toLowerCase().includes(search.toLowerCase()))
      const matchesMethod = method === 'all' || o.method === method
      const matchesStatus = status === 'all' || o.status === status
      return matchesSearch && matchesMethod && matchesStatus
    })
  }, [orders, search, method, status])

  const simulateCapture = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'paid' } : o))
  }

  const simulateRefund = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'pending' } : o))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center"><CreditCard className="w-6 h-6 mr-2"/>Orders & Payments</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
          <RefreshCcw className="w-4 h-4 mr-2"/>Refresh
        </button>
      </div>

      <div className="bg-white border rounded p-4 mb-4">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by Order ID or Customer"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="px-3 py-2 border rounded" value={method} onChange={e => setMethod(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="Stripe">Stripe</option>
            <option value="PayPal">PayPal</option>
          </select>
          <select className="px-3 py-2 border rounded" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center">{filtered.length} of {orders.length} orders</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-semibold">Order ID</th>
              <th className="text-left p-3 font-semibold">Customer</th>
              <th className="text-left p-3 font-semibold">Amount</th>
              <th className="text-left p-3 font-semibold">Method</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-mono">{o.id}</td>
                <td className="p-3">{o.customer}</td>
                <td className="p-3">${'{'}o.amount.toFixed(2){'}'}</td>
                <td className="p-3">{o.method}</td>
                <td className="p-3">{statusBadge(o.status)}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => simulateCapture(o.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Capture</button>
                  <button onClick={() => simulateRefund(o.id)} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700">Mark Pending</button>
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
