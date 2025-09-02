import { useRef, useState, useEffect } from 'react'

const News = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [articles, setArticles] = useState([
    {
      id: 1,
      title: 'Company Announces New Product Launch',
      excerpt: 'We are excited to announce the launch of our latest product that will revolutionize the industry.',
      author: 'Marketing Team',
      status: 'published',
      publishDate: '2024-01-15',
      category: 'Product News',
      tags: ['product','launch'],
      cover: '',
      content: '<p>Launching soon!</p>',
      seo: { title: 'Product Launch', description: 'Announcing new product', keywords: 'launch,product' }
    },
    {
      id: 2,
      title: 'Q4 Financial Results Released',
      excerpt: 'Our Q4 financial results show strong growth across all business segments.',
      author: 'Finance Team',
      status: 'draft',
      publishDate: '2024-01-12',
      category: 'Financial News',
      tags: ['finance','results'],
      cover: '',
      content: '<p>Strong performance.</p>',
      seo: { title: 'Q4 Results', description: 'Quarter highlights', keywords: 'finance,q4' }
    }
  ])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const editorRef = useRef(null)

  // Form state
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [author, setAuthor] = useState('Team')
  const [category, setCategory] = useState('General')
  const [status, setStatus] = useState('draft')
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0,10))
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [cover, setCover] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [content, setContent] = useState('')

  const openNew = () => {
    setEditingId(null)
    setTitle('')
    setExcerpt('')
    setAuthor('Team')
    setCategory('General')
    setStatus('draft')
    setPublishDate(new Date().toISOString().slice(0,10))
    setTags([])
    setTagInput('')
    setCover('')
    setSeoTitle('')
    setSeoDescription('')
    setSeoKeywords('')
    setContent('')
    setModalOpen(true)
  }

  const openEdit = (a) => {
    setEditingId(a.id)
    setTitle(a.title)
    setExcerpt(a.excerpt)
    setAuthor(a.author)
    setCategory(a.category)
    setStatus(a.status)
    setPublishDate(a.publishDate)
    setTags(a.tags || [])
    setCover(a.cover || '')
    setSeoTitle(a.seo?.title || '')
    setSeoDescription(a.seo?.description || '')
    setSeoKeywords(a.seo?.keywords || '')
    setContent(a.content || '')
    setModalOpen(true)
  }

  const onImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCover(reader.result)
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

  const saveArticle = () => {
    const article = {
      id: editingId ?? Math.max(0, ...articles.map(p => p.id)) + 1,
      title, excerpt, author, category, status, publishDate,
      tags, cover, content,
      seo: { title: seoTitle, description: seoDescription, keywords: seoKeywords }
    }
    if (editingId) {
      setArticles(articles.map(p => p.id === editingId ? article : p))
    } else {
      setArticles([article, ...articles])
    }
    setModalOpen(false)
  }

  const deleteArticle = (id) => setArticles(articles.filter(p => p.id !== id))

  const filteredArticles = articles.filter(article =>
    `${article.title} ${article.excerpt} ${(article.tags||[]).join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">News Articles</h1>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          New Article
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-4">
        {filteredArticles.map((article) => (
          <div key={article.id} className="bg-white border rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{article.title}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                article.status === 'published' ? 'bg-green-100 text-green-800' : 
                article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-blue-100 text-blue-800'
              }`}>
                {article.status}
              </span>
            </div>
            <p className="text-gray-600 mb-3">{article.excerpt}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>By {article.author} • {article.category} • {article.publishDate}</span>
              <div className="space-x-2">
                <button onClick={() => openEdit(article)} className="text-blue-600 hover:text-blue-800">Edit</button>
                <button onClick={() => deleteArticle(article.id)} className="text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(article.tags||[]).map(t => (
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
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input value={category} onChange={e=>setCategory(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Author</label>
                  <input value={author} onChange={e=>setAuthor(e.target.value)} className="w-full px-3 py-2 border rounded" />
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
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <textarea value={excerpt} onChange={e=>setExcerpt(e.target.value)} className="w-full px-3 py-2 border rounded" rows={2} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cover Image</label>
                <input type="file" accept="image/*" onChange={onImageChange} />
                {cover && <img src={cover} alt="cover" className="mt-2 h-32 object-cover rounded border" />}
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

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SEO Title</label>
                  <input value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SEO Description</label>
                  <input value={seoDescription} onChange={e=>setSeoDescription(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SEO Keywords</label>
                  <input value={seoKeywords} onChange={e=>setSeoKeywords(e.target.value)} placeholder="comma,separated,keywords" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={saveArticle} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default News
