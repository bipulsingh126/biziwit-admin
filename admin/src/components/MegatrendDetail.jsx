import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const MegatrendDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadMegatrend()
  }, [id])

  const loadMegatrend = async () => {
    try {
      setLoading(true)
      const result = await api.getMegatrend(id)
      setItem(result)
    } catch (err) {
      setError(err.message)
      // If not found, go back to list after a delay
      setTimeout(() => navigate('/admin/megatrends'), 2000)
    } finally {
      setLoading(false)
    }
  }

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

  const submitWhitepaperRequest = async (requestData) => {
    try {
      await api.requestWhitepaper(id, requestData)
    } catch (err) {
      console.error('Failed to submit whitepaper request:', err)
      throw err
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

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setSubmitting(true)
    try {
      const requestData = {
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        role: role.trim()
      }
      
      await submitWhitepaperRequest(requestData)
      setModalOpen(false)
      triggerDownload()
      
      // Reset form
      setName('')
      setEmail('')
      setCompany('')
      setRole('')
      setAgree(false)
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to submit request. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading megatrend...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-4">
            Error: {error}
          </div>
          <button onClick={() => navigate('/admin/megatrends')} className="text-blue-600 hover:text-blue-800">
            ← Back to Megatrends
          </button>
        </div>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/admin/megatrends')} className="text-sm text-gray-600 hover:text-gray-800">← Back to Megatrends</button>
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
                
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                    {errors.submit}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 border rounded" disabled={submitting}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Get Whitepaper'}
                  </button>
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
