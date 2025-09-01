import { useMemo, useState } from 'react'
import { Send, Plus, Trash2, Download } from 'lucide-react'

const initial = [
  { email: 'alice@example.com', createdAt: '2025-08-20' },
  { email: 'bob@example.com', createdAt: '2025-08-24' },
  { email: 'charlie@example.com', createdAt: '2025-08-28' },
]

const Newsletter = () => {
  const [emails, setEmails] = useState(initial)
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => emails.filter(e => e.email.toLowerCase().includes(q.toLowerCase())), [emails, q])

  const addEmail = () => {
    if (!input.trim()) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim())) return alert('Invalid email')
    if (emails.some(e => e.email.toLowerCase() === input.trim().toLowerCase())) return alert('Already subscribed')
    setEmails([{ email: input.trim(), createdAt: new Date().toISOString().slice(0,10) }, ...emails])
    setInput('')
  }

  const removeEmail = (email) => setEmails(prev => prev.filter(e => e.email !== email))

  const exportCSV = () => {
    const headers = ['Email','CreatedAt']
    const rows = filtered.map(i => [i.email, i.createdAt].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center"><Send className="w-6 h-6 mr-2"/>Newsletter</h1>
        <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm inline-flex items-center"><Download className="w-4 h-4 mr-2"/>Export CSV</button>
      </div>

      <div className="bg-white border rounded p-4 mb-4 grid md:grid-cols-3 gap-3">
        <div className="flex">
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Subscriber email" className="flex-1 px-3 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={addEmail} className="px-3 bg-green-600 text-white rounded-r hover:bg-green-700 inline-flex items-center"><Plus className="w-4 h-4"/></button>
        </div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search subscribers" className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="text-sm text-gray-500 flex items-center">{filtered.length} of {emails.length} subscribers</div>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-semibold">Email</th>
              <th className="text-left p-3 font-semibold">Subscribed</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.email} className="border-t">
                <td className="p-3">{s.email}</td>
                <td className="p-3">{s.createdAt}</td>
                <td className="p-3 text-right">
                  <button onClick={() => removeEmail(s.email)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center"><Trash2 className="w-3.5 h-3.5 mr-1"/>Remove</button>
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
