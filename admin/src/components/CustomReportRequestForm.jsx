import { useState } from 'react'

const STORAGE_KEY = 'custom_report_requests'

const CustomReportRequestForm = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [requirements, setRequirements] = useState('')
  const [deadline, setDeadline] = useState('')
  const [agree, setAgree] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required'
    if (!company.trim()) e.company = 'Company is required'
    if (!industry.trim()) e.industry = 'Industry is required'
    if (!requirements.trim()) e.requirements = 'Please describe your custom report needs'
    if (!agree) e.agree = 'Please accept the terms'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const record = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      name, email, company, industry,
      requirements, deadline,
      status: 'new',
      notes: ''
    }
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      existing.push(record)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to save request', err)
      alert('Could not submit right now. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border rounded max-w-xl w-full p-6 text-center">
          <h1 className="text-2xl font-bold">Thank you!</h1>
          <p className="text-gray-600 mt-2">Your custom report request has been received. Our team will contact you shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border rounded max-w-2xl w-full p-6">
        <h1 className="text-2xl font-bold mb-4">Request a Custom Report</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
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
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input value={company} onChange={e=>setCompany(e.target.value)} className={`w-full px-3 py-2 border rounded ${errors.company ? 'border-red-500' : ''}`} />
              {errors.company && <p className="text-xs text-red-600 mt-1">{errors.company}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <input value={industry} onChange={e=>setIndustry(e.target.value)} className={`w-full px-3 py-2 border rounded ${errors.industry ? 'border-red-500' : ''}`} />
              {errors.industry && <p className="text-xs text-red-600 mt-1">{errors.industry}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Requirements</label>
            <textarea value={requirements} onChange={e=>setRequirements(e.target.value)} rows={4} className={`w-full px-3 py-2 border rounded ${errors.requirements ? 'border-red-500' : ''}`} placeholder="Describe the scope, datasets, regions, timeframes, and KPIs you need" />
            {errors.requirements && <p className="text-xs text-red-600 mt-1">{errors.requirements}</p>}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Deadline</label>
              <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
                I agree to be contacted about this request.
              </label>
            </div>
          </div>
          {errors.agree && <p className="text-xs text-red-600">{errors.agree}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomReportRequestForm
