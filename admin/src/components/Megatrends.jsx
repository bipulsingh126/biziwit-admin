import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const Megatrends = () => {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([
    {
      id: 1,
      title: 'AI Everywhere',
      slug: 'ai-everywhere',
      summary: 'How AI permeates products, workflows, and industries.',
      status: 'published',
      publishDate: '2025-08-01',
      tags: ['ai', 'automation'],
      hero: '',
      content: '<p>AI is reshaping every industry...</p>'
    },
    {
      id: 2,
      title: 'Sustainable Tech',
      slug: 'sustainable-tech',
      summary: 'Green software, low-carbon infra, and circular devices.',
      status: 'draft',
      publishDate: '2025-09-10',
      tags: ['sustainability', 'green'],
      hero: '',
      content: '<p>Sustainability is now a core requirement...</p>'
    }
  ])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const editorRef = useRef(null)

  // form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState('draft')
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0,10))
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [hero, setHero] = useState('')
  const [content, setContent] = useState('')

  const filtered = items.filter(i =>
    `${i.title} ${i.summary} ${(i.tags||[]).join(' ')}`.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => {
    setEditingId(null)
    setTitle('')
    setSlug('')
    setSummary('')
    setStatus('draft')
    setPublishDate(new Date().toISOString().slice(0,10))
    setTags([])
    setTagInput('')
    setHero('')
    setContent('')
    setModalOpen(true)
  }

  const openEdit = (it) => {
    setEditingId(it.id)
    setTitle(it.title)
    setSlug(it.slug)
    setSummary(it.summary)
    setStatus(it.status)
    setPublishDate(it.publishDate)
    setTags(it.tags || [])
    setHero(it.hero || '')
    setContent(it.content || '')
    setModalOpen(true)
  }

  const onImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setHero(reader.result)
    reader.readAsDataURL(file)
  }

  const addTagFromInput = () => {
    const t = tagInput.trim()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }
  const removeTag = (t) => setTags(tags.filter(x => x !== t))

  const applyFormat = (cmd) => {
    document.execCommand(cmd, false, null)
    setContent(editorRef.current?.innerHTML || '')
  }

  const save = () => {
    const id = editingId ?? Math.max(0, ...items.map(p => p.id)) + 1
    const slugVal = (slug || title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))
    const rec = { id, title, slug: slugVal, summary, status, publishDate, tags, hero, content }
    if (editingId) setItems(items.map(p => p.id === editingId ? rec : p))
    else setItems([rec, ...items])
    setModalOpen(false)
  }

  const del = (id) => setItems(items.filter(p => p.id !== id))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Megatrends</h1>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">New Megatrend</button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Search megatrends..."
          className="w-full max-w-md px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-4">
        {filtered.map(it => (
          <div key={it.id} className="bg-white border rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{it.title}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                it.status === 'published' ? 'bg-green-100 text-green-800' :
                it.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {it.status}
              </span>
            </div>
            <p className="text-gray-600 mb-3">{it.summary}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{it.publishDate}</span>
              <div className="space-x-2">
                <Link to={`/megatrends/${it.id}`} className="text-indigo-600 hover:text-indigo-800">Open</Link>
                <button onClick={()=>openEdit(it)} className="text-blue-600 hover:text-blue-800">Edit</button>
                <button onClick={()=>del(it.id)} className="text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(it.tags||[]).map(t => (
                <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">#{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Megatrend' : 'New Megatrend'}</h2>
              <button onClick={()=>setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input value={slug} onChange={e=>setSlug(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full px-3 py-2 border rounded">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Publish Date</label>
                  <input type="date" value={publishDate} onChange={e=>setPublishDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Summary</label>
                <textarea value={summary} onChange={e=>setSummary(e.target.value)} className="w-full px-3 py-2 border rounded" rows={2} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hero Image</label>
                <input type="file" accept="image/*" onChange={onImageChange} />
                {hero && <img src={hero} alt="hero" className="mt-2 h-32 object-cover rounded border" />}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => applyFormat('bold')} type="button" className="px-2 py-1 text-xs border rounded">Bold</button>
                  <button onClick={() => applyFormat('italic')} type="button" className="px-2 py-1 text-xs border rounded">Italic</button>
                  <button onClick={() => applyFormat('insertUnorderedList')} type="button" className="px-2 py-1 text-xs border rounded">Bullets</button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={() => setContent(editorRef.current?.innerHTML || '')}
                  className="min-h-[160px] border rounded p-3 focus:outline-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map(t => (
                    <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 rounded inline-flex items-center gap-1">
                      #{t}
                      <button onClick={() => removeTag(t)} className="text-gray-500">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' || e.key===','){ e.preventDefault(); addTagFromInput() } }} placeholder="Type a tag and press Enter" className="flex-1 px-3 py-2 border rounded-l" />
                  <button onClick={addTagFromInput} type="button" className="px-3 bg-blue-600 text-white rounded-r">Add</button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={()=>setModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Megatrends
