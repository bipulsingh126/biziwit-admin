import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Search, Filter, TrendingUp, Image, Upload } from 'lucide-react'
import api from '../utils/api'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [trendingIndustries, setTrendingIndustries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [showTrendingMenu, setShowTrendingMenu] = useState(false)
  const [showTop10ChooseModal, setShowTop10ChooseModal] = useState(false)
  const [selectedTop10Categories, setSelectedTop10Categories] = useState([])
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false)
  const [showQuickAddSubcategory, setShowQuickAddSubcategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [trendingFilter, setTrendingFilter] = useState('all') // 'all', 'trending', 'not-trending'
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    subcategories: [],
    isTopTrending: false
  })
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    description: ''
  })
  const [quickCategoryForm, setQuickCategoryForm] = useState({
    name: '',
    description: ''
  })
  const [quickSubcategoryForm, setQuickSubcategoryForm] = useState({
    name: '',
    description: '',
    categoryId: ''
  })

  useEffect(() => {
    loadCategories()
    loadTrendingIndustries()
  }, [])

  const loadTrendingIndustries = async () => {
    try {
      const response = await api.getTrendingIndustries()
      setTrendingIndustries(response.data || [])
    } catch (err) {
      console.error('Failed to load trending industries:', err)
    }
  }

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await api.getCategories()
      console.log('📊 Loaded categories:', response.data)
      setCategories(response.data || [])
    } catch (err) {
      setError('Failed to load categories')
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    try {
      if (!categoryForm.name.trim()) {
        setError('Category name is required')
        return
      }

      await api.createCategory(categoryForm)
      setSuccess('Category created successfully')
      setShowAddModal(false)
      setCategoryForm({ name: '', description: '', subcategories: [], isTopTrending: false })
      loadCategories()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create category')
    }
  }

  const handleEditCategory = async () => {
    try {
      if (!categoryForm.name.trim()) {
        setError('Category name is required')
        return
      }

      await api.updateCategory(editingCategory._id, categoryForm)
      setSuccess('Category updated successfully')
      setShowEditModal(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', subcategories: [], isTopTrending: false })
      loadCategories()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update category')
    }
  }

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.deleteCategory(category._id)
      setSuccess('Category deleted successfully')
      loadCategories()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete category')
    }
  }

  const handleAddSubcategory = async () => {
    try {
      if (!subcategoryForm.name.trim()) {
        setError('Subcategory name is required')
        return
      }

      await api.addSubcategory(selectedCategory._id, subcategoryForm)
      setSuccess('Subcategory added successfully')
      setShowSubcategoryModal(false)
      setSubcategoryForm({ name: '', description: '' })
      setSelectedCategory(null)
      loadCategories()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to add subcategory')
    }
  }

  const handleDeleteSubcategory = async (category, subcategory) => {
    if (!window.confirm(`Are you sure you want to delete "${subcategory.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.deleteSubcategory(category._id, subcategory._id)
      setSuccess('Subcategory deleted successfully')
      loadCategories()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete subcategory')
    }
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const openEditModal = (category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      subcategories: category.subcategories || [],
      isTopTrending: category.isTopTrending || false
    })
    setShowEditModal(true)
  }

  const openSubcategoryModal = (category) => {
    setSelectedCategory(category)
    setShowSubcategoryModal(true)
  }

  const filteredCategories = categories.filter(category => {
    // Search filter
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.subcategories?.some(sub => 
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    // Trending filter
    const matchesTrending = trendingFilter === 'all' || 
      (trendingFilter === 'trending' && category.isTopTrending) ||
      (trendingFilter === 'not-trending' && !category.isTopTrending)
    
    return matchesSearch && matchesTrending
  })

  const seedCategories = async () => {
    try {
      await api.seedCategories()
      setSuccess('Categories seeded successfully')
      loadCategories()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to seed categories')
    }
  }

  // Quick Add Functions
  const handleQuickAddCategory = async () => {
    try {
      if (!quickCategoryForm.name.trim()) {
        setError('Category name is required')
        return
      }

      await api.createCategory(quickCategoryForm)
      setSuccess('Category created successfully')
      setShowQuickAddCategory(false)
      setQuickCategoryForm({ name: '', description: '' })
      loadCategories()
      loadTrendingIndustries()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create category')
    }
  }

  const handleQuickAddSubcategory = async () => {
    try {
      if (!quickSubcategoryForm.name.trim() || !quickSubcategoryForm.categoryId) {
        setError('Subcategory name and category selection are required')
        return
      }

      await api.addSubcategory(quickSubcategoryForm.categoryId, {
        name: quickSubcategoryForm.name,
        description: quickSubcategoryForm.description
      })
      setSuccess('Subcategory added successfully')
      setShowQuickAddSubcategory(false)
      setQuickSubcategoryForm({ name: '', description: '', categoryId: '' })
      loadCategories()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to add subcategory')
    }
  }

  // Handle checkbox toggle for Top 10 categories
  const handleTop10CheckboxToggle = (categoryId) => {
    setSelectedTop10Categories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  // Handle select all checkboxes
  const handleSelectAllTop10 = () => {
    if (selectedTop10Categories.length === trendingIndustries.length) {
      setSelectedTop10Categories([])
    } else {
      setSelectedTop10Categories(trendingIndustries.map(industry => industry._id))
    }
  }

  // Handle selecting categories from Top 10
  const handleSelectTop10Categories = () => {
    if (selectedTop10Categories.length === 0) {
      setError('Please select at least one category')
      setTimeout(() => setError(''), 3000)
      return
    }

    // Expand all selected categories
    const newExpandedCategories = {}
    selectedTop10Categories.forEach(categoryId => {
      newExpandedCategories[categoryId] = true
    })
    setExpandedCategories(prev => ({ ...prev, ...newExpandedCategories }))

    // Clear search to show all categories
    setSearchTerm('')

    // Close modal
    setShowTop10ChooseModal(false)

    // Show success message
    setSuccess(`Selected ${selectedTop10Categories.length} categor${selectedTop10Categories.length === 1 ? 'y' : 'ies'} from Top 10`)
    setTimeout(() => setSuccess(''), 3000)

    // Scroll to first selected category
    setTimeout(() => {
      const firstCategoryId = selectedTop10Categories[0]
      const element = document.getElementById(`category-${firstCategoryId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Highlight effect
        element.classList.add('bg-indigo-100')
        setTimeout(() => element.classList.remove('bg-indigo-100'), 2000)
      }
    }, 100)

    // Reset selection
    setSelectedTop10Categories([])
  }

  // Handle toggle trending status
  const handleToggleTrending = async (categoryId, newTrendingStatus) => {
    try {
      console.log('🔄 Updating trending status:', { categoryId, newTrendingStatus })
      // Update the category with new trending status
      const result = await api.updateCategory(categoryId, { isTopTrending: newTrendingStatus })
      console.log('✅ Update result:', result)
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat._id === categoryId 
          ? { ...cat, isTopTrending: newTrendingStatus }
          : cat
      ))
      
      // Show success message
      const statusText = newTrendingStatus ? 'added to' : 'removed from'
      setSuccess(`Category ${statusText} Top 10 Trending successfully`)
      setTimeout(() => setSuccess(''), 3000)
      
      // Refresh trending data
      loadTrendingIndustries()
    } catch (err) {
      setError(err.message || 'Failed to update trending status')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Handle bulk operations
  const handleSelectCategory = (categoryId) => {
    setSelectedCategories(prev => {
      const newSelected = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
      
      // Update select all state
      setSelectAll(newSelected.length === filteredCategories.length && filteredCategories.length > 0)
      return newSelected
    })
  }

  const handleSelectAllCategories = () => {
    if (selectAll) {
      setSelectedCategories([])
      setSelectAll(false)
    } else {
      setSelectedCategories(filteredCategories.map(cat => cat._id))
      setSelectAll(true)
    }
  }

  const handleBulkTrendingUpdate = async (newTrendingStatus) => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one category')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      console.log('🔄 Bulk updating trending status:', { selectedCategories, newTrendingStatus })
      // Update all selected categories
      const updatePromises = selectedCategories.map(categoryId => 
        api.updateCategory(categoryId, { isTopTrending: newTrendingStatus })
      )
      const results = await Promise.all(updatePromises)
      console.log('✅ Bulk update results:', results)

      // Update local state
      setCategories(prev => prev.map(cat => 
        selectedCategories.includes(cat._id)
          ? { ...cat, isTopTrending: newTrendingStatus }
          : cat
      ))

      // Clear selection
      setSelectedCategories([])
      setSelectAll(false)

      // Show success message
      const statusText = newTrendingStatus ? 'added to' : 'removed from'
      setSuccess(`${selectedCategories.length} categories ${statusText} Top 10 Trending successfully`)
      setTimeout(() => setSuccess(''), 3000)

      // Refresh trending data
      loadTrendingIndustries()
    } catch (err) {
      setError(err.message || 'Failed to update trending status')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories & Subcategories</h1>
          <p className="text-gray-600 mt-1">Manage report categories and their subcategories</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuickAddSubcategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Quick Add Subcategory
          </button>
          {categories.length === 0 && (
            <button
              onClick={seedCategories}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Seed Categories
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Search Bar and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search categories and subcategories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Trending Filter Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by trending status:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTrendingFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                trendingFilter === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Categories ({categories.length})
            </button>
            <button
              onClick={() => setTrendingFilter('trending')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                trendingFilter === 'trending'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Trending ({categories.filter(c => c.isTopTrending).length})
            </button>
            <button
              onClick={() => setTrendingFilter('not-trending')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                trendingFilter === 'not-trending'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Not Trending ({categories.filter(c => !c.isTopTrending).length})
            </button>
          </div>
        </div>
        
        {/* Bulk Operations Toolbar */}
        {selectedCategories.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-800">
                  {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkTrendingUpdate(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  Mark as Trending
                </button>
                <button
                  onClick={() => handleBulkTrendingUpdate(false)}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  Remove from Trending
                </button>
                <button
                  onClick={() => {
                    setSelectedCategories([])
                    setSelectAll(false)
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAllCategories}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reports Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trending Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                      Loading categories...
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No categories found matching your search.' : 'No categories found. Click "Add Category" to create one.'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <>
                    {/* Main Category Row */}
                    <tr key={category._id} id={`category-${category._id}`} className="hover:bg-gray-50 transition-colors duration-500">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category._id)}
                          onChange={() => handleSelectCategory(category._id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleCategory(category._id)}
                            className="mr-2 p-1 hover:bg-gray-100 rounded"
                          >
                            {expandedCategories[category._id] ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            {category.description && (
                              <div className="text-sm text-gray-500">{category.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {category.subcategories?.length || 0} subcategories
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {category.reportCount || 0} reports
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleTrending(category._id, !category.isTopTrending)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            category.isTopTrending
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {category.isTopTrending ? (
                            <>
                              <TrendingUp className="w-3 h-3" />
                              Top Trending
                            </>
                          ) : (
                            <>
                              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                              Not Trending
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openSubcategoryModal(category)}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                            title="Add Subcategory"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(category)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="Edit Category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Subcategories Rows */}
                    {expandedCategories[category._id] && category.subcategories?.map((subcategory) => (
                      <tr key={`${category._id}-${subcategory._id}`} className="bg-gray-25">
                        <td className="px-6 py-3">
                          {/* Empty cell for checkbox alignment */}
                        </td>
                        <td className="px-6 py-3 pl-16">
                          <div>
                            <div className="text-sm text-gray-700">└ {subcategory.name}</div>
                            {subcategory.description && (
                              <div className="text-xs text-gray-500">{subcategory.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          Subcategory
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {subcategory.reportCount || 0} reports
                        </td>
                        <td className="px-6 py-3 text-sm font-medium">
                          <button
                            onClick={() => handleDeleteSubcategory(category, subcategory)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Delete Subcategory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>
              
              {/* Top 10 Trending Option */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="topTrending"
                    checked={categoryForm.isTopTrending}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, isTopTrending: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="topTrending" className="ml-2 text-sm font-medium text-purple-700 cursor-pointer">
                    ✓ Add to Top 10 Trending
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-purple-600">
                    Mark this category as trending to feature it prominently in the Top 10 list
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setCategoryForm({ name: '', description: '', subcategories: [], isTopTrending: false })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>
              
              {/* Top 10 Trending Option */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editTopTrending"
                    checked={categoryForm.isTopTrending}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, isTopTrending: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="editTopTrending" className="ml-2 text-sm font-medium text-purple-700 cursor-pointer">
                    ✓ Add to Top 10 Trending
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-purple-600">
                    Mark this category as trending to feature it prominently in the Top 10 list
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingCategory(null)
                  setCategoryForm({ name: '', description: '', subcategories: [], isTopTrending: false })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Add Subcategory to "{selectedCategory?.name}"
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subcategory name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={subcategoryForm.description}
                  onChange={(e) => setSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter subcategory description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSubcategoryModal(false)
                  setSelectedCategory(null)
                  setSubcategoryForm({ name: '', description: '' })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubcategory}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Trending Industries Modal */}
      {showTrendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Top 10 Trending Industries
            </h2>
            <div className="space-y-3">
              {trendingIndustries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No trending data available</p>
              ) : (
                trendingIndustries.map((industry, index) => (
                  <div key={industry._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900">{industry.name}</h3>
                        <p className="text-sm text-gray-500">{industry.subcategoriesCount} subcategories</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">{industry.reportCount} reports</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTrendingModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Category Modal */}
      {showQuickAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-green-700">Quick Add Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={quickCategoryForm.name}
                  onChange={(e) => setQuickCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={quickCategoryForm.description}
                  onChange={(e) => setQuickCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowQuickAddCategory(false)
                  setQuickCategoryForm({ name: '', description: '' })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddCategory}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Subcategory Modal */}
      {showQuickAddSubcategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-orange-700">Quick Add Subcategory</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category *
                </label>
                <select
                  value={quickSubcategoryForm.categoryId}
                  onChange={(e) => setQuickSubcategoryForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Choose a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  value={quickSubcategoryForm.name}
                  onChange={(e) => setQuickSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter subcategory name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={quickSubcategoryForm.description}
                  onChange={(e) => setQuickSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="Enter subcategory description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowQuickAddSubcategory(false)
                  setQuickSubcategoryForm({ name: '', description: '', categoryId: '' })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddSubcategory}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Add Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trending Modal */}
      {showTrendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top 10 Trending Categories</h2>
              <button
                onClick={() => setShowTrendingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {trendingIndustries.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No trending data available</p>
                  <p className="text-sm text-gray-400 mt-2">Add some reports to see trending categories</p>
                </div>
              ) : (
                trendingIndustries.map((industry, index) => (
                  <div key={industry._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{industry.name}</h3>
                        <p className="text-sm text-gray-600">{industry.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">{industry.reportCount}</div>
                      <div className="text-sm text-gray-500">reports</div>
                      <div className="text-xs text-gray-400">{industry.subcategoriesCount} subcategories</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  loadTrendingIndustries()
                  setSuccess('Trending data refreshed!')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={() => setShowTrendingModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Category Choose Modal with Checkboxes */}
      {showTop10ChooseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Top 10 Category Choose</h2>
                <p className="text-gray-600 mt-1">Select categories using checkboxes and click "Select" button</p>
              </div>
              <button
                onClick={() => {
                  setShowTop10ChooseModal(false)
                  setSelectedTop10Categories([])
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Select All Checkbox */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <label className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedTop10Categories.length === trendingIndustries.length && trendingIndustries.length > 0}
                  onChange={handleSelectAllTop10}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-semibold text-gray-900">
                  Select All ({trendingIndustries.length} categories)
                </span>
              </label>
            </div>
            
            <div className="space-y-3">
              {trendingIndustries.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="text-gray-500 text-lg font-medium">No trending data available</p>
                  <p className="text-sm text-gray-400 mt-2">Add some reports to see trending categories</p>
                  <button
                    onClick={() => {
                      loadTrendingIndustries()
                      setSuccess('Trending data loaded!')
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Load Trending Data
                  </button>
                </div>
              ) : (
                trendingIndustries.map((industry, index) => (
                  <label
                    key={industry._id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedTop10Categories.includes(industry._id)
                        ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-indigo-400 shadow-md'
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTop10Categories.includes(industry._id)}
                      onChange={() => handleTop10CheckboxToggle(industry._id)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                    />
                    
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">
                        {industry.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {industry.description || 'No description available'}
                      </p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-2xl font-bold text-indigo-600">{industry.reportCount}</div>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">reports</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {industry.subcategoriesCount} subcategories
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-semibold text-indigo-600 text-lg">{selectedTop10Categories.length}</span>
                <span className="text-gray-600"> of {trendingIndustries.length} categories selected</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTop10ChooseModal(false)
                    setSelectedTop10Categories([])
                  }}
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectTop10Categories}
                  disabled={selectedTop10Categories.length === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedTop10Categories.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select Categories
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside handler for trending menu */}
      {showTrendingMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowTrendingMenu(false)}
        />
      )}
    </div>
  )
}

export default Categories
