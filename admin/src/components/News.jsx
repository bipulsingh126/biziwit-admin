import { useRef, useState, useEffect } from 'react'
import api from '../utils/api'

const News = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  const [coverFile, setCoverFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    loadArticles()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const params = { q: searchTerm, type: 'news' }
      if (statusFilter !== 'all') params.status = statusFilter
      console.log('Loading news articles with params:', params)
      const result = await api.getPosts(params)
      console.log('API response:', result)
      setArticles(result.items || [])
      console.log('Articles set:', result.items || [])
    } catch (err) {
      console.error('Error loading articles:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
    setCoverFile(null)
    setSeoTitle('')
    setSeoDescription('')
    setSeoKeywords('')
    setContent('')
    setModalOpen(true)
  }

  const openEdit = (a) => {
    setEditingId(a._id)
    setTitle(a.title || '')
    setExcerpt(a.excerpt || '')
    setAuthor(a.author || 'Team')
    setCategory(a.category || 'General')
    setStatus(a.status || 'draft')
    setPublishDate(a.publishDate || new Date().toISOString().slice(0,10))
    setTags(a.tags || [])
    setCover(a.coverImage?.url || '')
    setSeoTitle(a.metaTitle || '')
    setSeoDescription(a.metaDescription || '')
    setSeoKeywords(a.metaKeywords || '')
    setContent(a.content || '')
    setModalOpen(true)
  }

  const onImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB')
      return
    }
    
    setCoverFile(file)
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

  const saveArticle = async () => {
    try {
      setUploading(true)
      const articleData = {
        title, excerpt, author, category, status, publishDate,
        tags, content, type: 'news',
        metaTitle: seoTitle,
        metaDescription: seoDescription,
        metaKeywords: seoKeywords
      }
      
      console.log('Saving article data:', articleData)
      
      let savedArticle
      if (editingId) {
        savedArticle = await api.updatePost(editingId, articleData)
      } else {
        savedArticle = await api.createPost(articleData)
      }
      
      console.log('Saved article:', savedArticle)
      
      if (coverFile && savedArticle._id) {
        await api.uploadPostCover(savedArticle._id, coverFile, title)
      }
      
      setModalOpen(false)
      loadArticles()
    } catch (err) {
      console.error('Error saving article:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const deleteArticle = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return
    try {
      await api.deletePost(id)
      setArticles(prev => prev.filter(p => p._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

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

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-4">
          Error: {error}
          <button onClick={loadArticles} className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm">Retry</button>
        </div>
      )}


      <div className="grid gap-4">
        {articles.map((article) => (
          <div key={article._id} className="bg-white border rounded p-4">
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
                <button onClick={() => deleteArticle(article._id)} className="text-red-600 hover:text-red-800">Delete</button>
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
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onImageChange}
                  className="w-full px-3 py-2 border rounded"
                />
                {cover && (
                  <div className="mt-2">
                    <img src={cover} alt="cover" className="h-32 object-cover rounded border" />
                    <button 
                      onClick={() => {setCover(''); setCoverFile(null)}}
                      className="mt-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove image
                    </button>
                  </div>
                )}
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
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded" disabled={uploading}>Cancel</button>
                <button 
                  onClick={saveArticle} 
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default News
