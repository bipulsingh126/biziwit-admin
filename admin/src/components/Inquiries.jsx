import { useMemo, useState } from 'react'
import { Inbox, Mail, Filter, Download } from 'lucide-react'

const seed = [
  { id: 'CQ-2001', name: 'Jane Cooper', email: 'jane@example.com', subject: 'Pricing', message: 'Can you share enterprise pricing?', status: 'open', createdAt: '2025-08-25 11:32' },
  { id: 'CQ-2002', name: 'Wade Warren', email: 'wade@example.com', subject: 'Bug report', message: 'Issue on checkout page.', status: 'resolved', createdAt: '2025-08-26 15:12' },
  { id: 'CQ-2003', name: 'Esther Howard', email: 'esther@example.com', subject: 'Partnership', message: 'Interested in partnership program.', status: 'open', createdAt: '2025-08-28 09:05' },
]

const Inquiries = () => {
  const [items, setItems] = useState(seed)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchText = [i.id, i.name, i.email, i.subject, i.message].some(v => v.toLowerCase().includes(q.toLowerCase()))
      const matchStatus = status === 'all' || i.status === status
      return matchText && matchStatus
    })
  }, [items, q, status])

  const markResolved = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i))
  const markOpen = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'open' } : i))

  const exportCSV = () => {
    const headers = ['ID','Name','Email','Subject','Message','Status','CreatedAt']
    const rows = filtered.map(i => [i.id,i.name,i.email,i.subject,`"${i.message.replace(/"/g,'""')}"`,i.status,i.createdAt].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inquiries.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center"><Inbox className="w-6 h-6 mr-2"/>Inquiries</h1>
        <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm inline-flex items-center"><Download className="w-4 h-4 mr-2"/>Export CSV</button>
      </div>

      <div className="bg-white border rounded p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <input className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search name, email, subject, message" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="px-3 py-2 border rounded" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center"><Filter className="w-4 h-4 mr-1"/> {filtered.length} of {items.length} inquiries</div>
        </div>
      </div>

      <div className="bg-white border rounded divide-y">
        {filtered.map(i => (
          <div key={i.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-3 sm:mb-0">
              <div className="font-medium">{i.subject}</div>
              <div className="text-sm text-gray-600">{i.name} • {i.email}</div>
              <div className="mt-2 text-gray-700 text-sm line-clamp-2">{i.message}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded ${i.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>{i.status}</span>
              {i.status === 'open' ? (
                <button onClick={() => markResolved(i.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Mark Resolved</button>
              ) : (
                <button onClick={() => markOpen(i.id)} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700">Reopen</button>
              )}
              <a href={`mailto:${i.email}`} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"><Mail className="w-3.5 h-3.5 mr-1"/>Reply</a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 text-blue-800 rounded p-4 text-sm">
        <p className="font-semibold mb-1">Frontend-only note</p>
        <p>Hook this into your backend to persist inquiries and send email notifications.</p>
      </div>
    </div>
  )
}

export default Inquiries
