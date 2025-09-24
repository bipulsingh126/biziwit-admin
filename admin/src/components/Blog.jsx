import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Edit, Trash2, Eye, Bold, Italic, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import api from '../utils/api'

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError('') // Clear any previous errors
      console.log('Loading blog posts...') // Debug log
      
      const params = { q: searchTerm, type: 'blog' }
      if (statusFilter !== 'all') params.status = statusFilter
      
      console.log('API request params:', params) // Debug log
      const result = await api.getPosts(params)
      console.log('API response:', result) // Debug log
      
      setPosts(result.items || [])
    } catch (err) {
      console.error('Error loading posts:', err) // Debug log
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts

  // Form state
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0,10))
  const [authorName, setAuthorName] = useState('')
  const [contentBody, setContentBody] = useState('')
  const [mainImage, setMainImage] = useState('')
  const [mainImageFile, setMainImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const editorRef = useRef(null)

  const openNew = () => {
    setEditingId(null)
    setTitle('')
    setSubtitle('')
    setPublishDate(new Date().toISOString().slice(0,10))
    setAuthorName('')
    setContentBody('')
    setMainImage('')
    setMainImageFile(null)
    setModalOpen(true)
  }

  const openEdit = (post) => {
    setEditingId(post._id)
    setTitle(post.title || '')
    setSubtitle(post.excerpt || '') // Map excerpt to subtitle
    setPublishDate(post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10)) // Map publishedAt to publishDate
    setAuthorName(post.author || '') // Map author to authorName
    setContentBody(post.content || '') // Map content to contentBody
    setMainImage(post.coverImage?.url || '') // Map coverImage to mainImage
    setModalOpen(true)
  }

  const onImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB')
      return
    }
    
    setMainImageFile(file)
    
    // Show preview
    const reader = new FileReader()
    reader.onload = () => setMainImage(reader.result)
    reader.readAsDataURL(file)
  }

  // Rich text editor functions
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setContentBody(editorRef.current.innerHTML)
    }
  }

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContentBody(editorRef.current.innerHTML)
    }
  }

  const savePost = async () => {
    try {
      setUploading(true)
      setError('') // Clear any previous errors
      
      const postData = {
        title,
        excerpt: subtitle, // Map subtitle to excerpt for backend
        author: authorName, // Map authorName to author for backend
        content: contentBody, // Map contentBody to content for backend
        publishedAt: publishDate, // Map publishDate to publishedAt for backend
        status: 'published', // Set default status
        type: 'blog',
        coverImage: mainImage ? { url: mainImage, alt: title } : undefined
      }
      
      console.log('Saving blog post with data:', postData) // Debug log
      
      let savedPost
      if (editingId) {
        savedPost = await api.updatePost(editingId, postData)
        console.log('Updated post:', savedPost) // Debug log
      } else {
        savedPost = await api.createPost(postData)
        console.log('Created post:', savedPost) // Debug log
      }
      
      // Upload main image if selected
      if (mainImageFile && savedPost._id) {
        console.log('Uploading cover image...') // Debug log
        await api.uploadPostCover(savedPost._id, mainImageFile, title)
      }
      
      setModalOpen(false)
      loadPosts() // Reload posts from API
      console.log('Blog post saved successfully!') // Debug log
    } catch (err) {
      console.error('Error saving blog post:', err) // Debug log
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const deletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await api.deletePost(id)
      setPosts(prev => prev.filter(p => p._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable]:focus:before {
          display: none;
        }
      `}</style>
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          ADD BLOG
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search posts..."
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
          <p className="text-gray-600">Loading posts...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-4">
          Error: {error}
          <button onClick={loadPosts} className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm">Retry</button>
        </div>
      )}

      <div className="grid gap-4">
        {filteredPosts.map((post) => (
          <div key={post._id} className="bg-white border rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                post.status === 'published' ? 'bg-green-100 text-green-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {post.status}
              </span>
            </div>
            <p className="text-gray-600 mb-3">{post.excerpt}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>By {post.author} • {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'No date'}</span>
              <div className="space-x-2">
                <button onClick={() => openEdit(post)} className="text-blue-600 hover:text-blue-800">Edit</button>
                <button onClick={() => deletePost(post._id)} className="text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Blog' : 'Add Blog'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Blog Title</label>
                  <input 
                    value={title} 
                    onChange={e=>setTitle(e.target.value)} 
                    className="w-full px-3 py-2 border rounded" 
                    placeholder="Enter your blog post title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sub Title</label>
                  <input 
                    value={subtitle} 
                    onChange={e=>setSubtitle(e.target.value)} 
                    className="w-full px-3 py-2 border rounded" 
                    placeholder="Enter blog subtitle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Author Name</label>
                  <input 
                    value={authorName} 
                    onChange={e=>setAuthorName(e.target.value)} 
                    className="w-full px-3 py-2 border rounded" 
                    placeholder="Enter author name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Publish Date</label>
                  <input type="date" value={publishDate} onChange={e=>setPublishDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Main Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onImageChange}
                  className="w-full px-3 py-2 border rounded"
                />
                {mainImage && (
                  <div className="mt-2">
                    <img src={mainImage} alt="main image" className="h-32 object-cover rounded border" />
                    <button 
                      onClick={() => {setMainImage(''); setMainImageFile(null)}}
                      className="mt-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              {/* Content Body Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="content-editor">
                  Content Body
                </label>
                <div className="border rounded-lg">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyFormat('bold')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Bold"
                      aria-label="Bold text"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('italic')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Italic"
                      aria-label="Italic text"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('underline')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Underline"
                      aria-label="Underline text"
                    >
                      <span className="w-4 h-4 flex items-center justify-center text-sm font-bold">U</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => applyFormat('insertUnorderedList')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Bullet List"
                      aria-label="Create bullet list"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('insertOrderedList')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Numbered List"
                      aria-label="Create numbered list"
                    >
                      <span className="w-4 h-4 flex items-center justify-center text-sm font-bold">1.</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => applyFormat('justifyLeft')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Align Left"
                      aria-label="Align text left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('justifyCenter')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Align Center"
                      aria-label="Align text center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('justifyRight')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Align Right"
                      aria-label="Align text right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <select
                      onChange={(e) => applyFormat('fontSize', e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                      defaultValue="3"
                    >
                      <option value="1">Small</option>
                      <option value="3">Normal</option>
                      <option value="5">Large</option>
                      <option value="7">Extra Large</option>
                    </select>
                    <select
                      onChange={(e) => applyFormat('foreColor', e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                      defaultValue="#000000"
                    >
                      <option value="#000000">Black</option>
                      <option value="#ff0000">Red</option>
                      <option value="#00ff00">Green</option>
                      <option value="#0000ff">Blue</option>
                      <option value="#ff6600">Orange</option>
                      <option value="#800080">Purple</option>
                    </select>
                  </div>
                  
                  {/* Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    className="min-h-[200px] max-h-[400px] p-4 focus:outline-none overflow-y-auto"
                    style={{ 
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}
                    dangerouslySetInnerHTML={{ __html: contentBody }}
                    data-placeholder="Write your blog content here. Use the toolbar above to format your text with bold, italic, lists, alignment, colors, and font sizes..."
                    aria-label="Content body editor"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Select text and use the toolbar buttons to apply formatting. You can create lists, change alignment, adjust font size, and apply colors to make your content engaging.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded" disabled={uploading}>Cancel</button>
                <button 
                  onClick={savePost} 
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
    </>
  )
}

export default Blog
