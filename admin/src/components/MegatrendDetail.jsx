import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const STORAGE_KEY = 'megatrend_submissions'

const MegatrendDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // In a real app this would come from a store/API. For demo, reuse a tiny mock here.
  const [items] = useState([
    {
      id: 1,
      title: 'AI Everywhere',
      summary: 'How AI permeates products, workflows, and industries.',
      content: '<p>AI is reshaping every industry...</p>',
    },
    {
      id: 2,
      title: 'Sustainable Tech',
      summary: 'Green software, low-carbon infra, and circular devices.',
      content: '<p>Sustainability is now a core requirement...</p>',
    },
  ])

  const item = useMemo(() => items.find(i => String(i.id) === String(id)), [items, id])

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!item) {
      // If not found, go back to list
      navigate('/megatrends')
    }
  }, [item, navigate])

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required'
    if (!company.trim()) e.company = 'Company is required'
    if (!role.trim()) e.role = 'Role is required'
    if (!agree) e.agree = 'You must agree to proceed'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const storeSubmission = (record) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      existing.push(record)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch (err) {
      console.error('Failed to store submission', err)
    }
  }

  const triggerDownload = () => {
    const content = `Whitepaper: ${item?.title}\n\nThank you for your interest.\nThis is a demo whitepaper placeholder generated on the fly.`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(item?.title || 'whitepaper').toLowerCase().replace(/\s+/g,'-')}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const rec = {
      id: Date.now(),
      megatrendId: item.id,
      megatrendTitle: item.title,
      name, email, company, role,
      agreed: agree,
      timestamp: new Date().toISOString(),
    }
    storeSubmission(rec)
    setModalOpen(false)
    triggerDownload()
  }

  if (!item) return null

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/megatrends')} className="text-sm text-gray-600 hover:text-gray-800">← Back to Megatrends</button>
        <h1 className="text-3xl font-bold mt-2">{item.title}</h1>
        <p className="text-gray-600 mt-2">{item.summary}</p>

        <div className="prose max-w-none mt-6" dangerouslySetInnerHTML={{ __html: item.content }} />

        <div className="mt-8">
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Download Whitepaper
          </button>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Whitepaper Request</h2>
                <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={onSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} className={`w-full px-3 py-2 border rounded ${errors.name ? 'border-red-500' : ''}`} />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={`w-full px-3 py-2 border rounded ${errors.email ? 'border-red-500' : ''}`} />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input value={company} onChange={e=>setCompany(e.target.value)} className={`w-full px-3 py-2 border rounded ${errors.company ? 'border-red-500' : ''}`} />
                    {errors.company && <p className="text-xs text-red-600 mt-1">{errors.company}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <input value={role} onChange={e=>setRole(e.target.value)} className={`w-full px-3 py-2 border rounded ${errors.role ? 'border-red-500' : ''}`} />
                    {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
                  I agree to be contacted about related products and services.
                </label>
                {errors.agree && <p className="text-xs text-red-600">{errors.agree}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Get Whitepaper</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MegatrendDetail
