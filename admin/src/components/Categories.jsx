import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Search, Filter, TrendingUp, Image, Upload, BarChart3 } from 'lucide-react'
import api from '../utils/api'

const Categories = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [trendingIndustries, setTrendingIndustries] = useState([])
  const [trendingSubcategories, setTrendingSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [showTrendingSubcategoriesModal, setShowTrendingSubcategoriesModal] = useState(false)
  const [showTrendingMenu, setShowTrendingMenu] = useState(false)
  const [showTop10ChooseModal, setShowTop10ChooseModal] = useState(false)
  const [selectedTop10Categories, setSelectedTop10Categories] = useState([])
  const [selectedTrendingSubcategories, setSelectedTrendingSubcategories] = useState([])
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false)
  const [showQuickAddSubcategory, setShowQuickAddSubcategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    subcategories: []
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
    loadTrendingSubcategories()
  }, [])

  // Refresh data when user returns to this page (for Excel import category updates)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCategories()
        loadTrendingIndustries()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadTrendingIndustries = async () => {
    try {
      const response = await api.getTrendingIndustries()
      setTrendingIndustries(response.data || [])
    } catch (err) {
      console.error('Failed to load trending industries:', err)
    }
  }

  const loadTrendingSubcategories = async () => {
    try {
      const response = await api.getTrendingSubcategories({ limit: 15 })
      console.log('🔥 Trending subcategories response:', response)
      setTrendingSubcategories(response.data || [])
    } catch (err) {
      console.warn('Trending subcategories not available:', err.message)
      setTrendingSubcategories([]) // Set empty array as fallback
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
      setCategoryForm({ name: '', description: '', subcategories: [] })
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
      setCategoryForm({ name: '', description: '', subcategories: [] })
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
      subcategories: category.subcategories || []
    })
    setShowEditModal(true)
  }

  const openSubcategoryModal = (category) => {
    setSelectedCategory(category)
    setShowSubcategoryModal(true)
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.subcategories?.some(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )

    return matchesSearch
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

  // Handle trending subcategories selection
  const handleTrendingSubcategoryToggle = (subcategoryId) => {
    setSelectedTrendingSubcategories(prev => {
      if (prev.includes(subcategoryId)) {
        return prev.filter(id => id !== subcategoryId)
      } else {
        return [...prev, subcategoryId]
      }
    })
  }

  const handleSelectAllTrendingSubcategories = () => {
    if (selectedTrendingSubcategories.length === trendingSubcategories.length) {
      setSelectedTrendingSubcategories([])
    } else {
      setSelectedTrendingSubcategories(trendingSubcategories.map(sub => sub._id))
    }
  }

  const handleMarkTrendingSubcategories = async (isTopTrending) => {
    if (selectedTrendingSubcategories.length === 0) {
      setError('Please select at least one subcategory')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      // Prepare updates array
      const subcategoryUpdates = selectedTrendingSubcategories.map(subId => {
        const subcategory = trendingSubcategories.find(sub => sub._id === subId)
        return {
          categoryId: subcategory.category._id,
          subcategoryId: subId
        }
      })

      // Bulk update trending status
      const response = await api.bulkUpdateSubcategoriesTrending(subcategoryUpdates, isTopTrending)

      // Show success message
      setSuccess(response.message || `${selectedTrendingSubcategories.length} subcategories ${isTopTrending ? 'marked as' : 'unmarked from'} trending`)
      setTimeout(() => setSuccess(''), 3000)

      // Refresh data
      loadTrendingSubcategories()
      loadCategories()

      // Clear selection
      setSelectedTrendingSubcategories([])
    } catch (err) {
      setError(err.message || 'Failed to update trending status')
      setTimeout(() => setError(''), 3000)
    }
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

  // Navigation functions for viewing reports by category/subcategory
  const navigateToReportsByCategory = (categoryName) => {
    navigate(`/reports?category=${encodeURIComponent(categoryName)}`)
  }

  const navigateToReportsBySubcategory = (categoryName, subcategoryName) => {
    navigate(`/reports?category=${encodeURIComponent(categoryName)}&subCategory=${encodeURIComponent(subcategoryName)}`)
  }

  // Sync reports with categories
  const handleSyncReportsWithCategories = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await api.syncReportsWithCategories()

      if (result.success) {
        const { categoriesUpdated, subcategoriesUpdated } = result.stats
        setSuccess(`Successfully synced reports: ${categoriesUpdated} categories and ${subcategoriesUpdated} subcategories updated`)

        // Refresh categories to show updated counts
        loadCategories()
      } else {
        throw new Error(result.message || 'Sync failed')
      }
    } catch (err) {
      setError(err.message || 'Failed to sync reports with categories')
    } finally {
      setLoading(false)
      setTimeout(() => setSuccess(''), 5000)
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

  // Bulk delete selected categories
  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.length === 0) return
    try {
      // Delete each selected category
      const deletePromises = selectedCategories.map(id => api.deleteCategory(id))
      await Promise.all(deletePromises)
      setSuccess(`${selectedCategories.length} categories deleted successfully`)
      setTimeout(() => setSuccess(''), 3000)
      // Refresh list
      loadCategories()
      // Clear selection
      setSelectedCategories([])
      setSelectAll(false)
    } catch (err) {
      setError(err.message || 'Failed to delete selected categories')
      setTimeout(() => setError(''), 3000)
    }
    setShowBulkDeleteModal(false)
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
            onClick={handleSyncReportsWithCategories}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sync existing reports with categories to update report counts"
          >
            <BarChart3 className="w-4 h-4" />
            {loading ? 'Syncing...' : 'Sync Reports'}
          </button>
          <button
            onClick={() => setShowTrendingModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Top 10 Trending
          </button>
          <button
            onClick={() => setShowTrendingSubcategoriesModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Trending Subcategories
          </button>
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

      {/* Bulk Delete Button */}
      {selectedCategories.length > 0 && (
        <div className="flex items-center mb-4">
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Selected ({selectedCategories.length})
          </button>
        </div>
      )}

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

        {/* Category Count */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              All Categories ({categories.length})
            </span>
          </div>
        </div>

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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                      Loading categories...
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
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
                            <button
                              onClick={() => navigateToReportsByCategory(category.name)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                              title={`View ${category.reportCount || 0} reports in this category`}
                            >
                              {category.name}
                            </button>
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
                        <button
                          onClick={() => navigateToReportsByCategory(category.name)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                          title={`View ${category.reportCount || 0} reports in this category`}
                        >
                          <BarChart3 className="w-4 h-4" />
                          {category.reportCount || 0} reports
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigateToReportsBySubcategory(category.name, subcategory.name)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                                title={`View ${subcategory.reportCount || 0} reports in this subcategory`}
                              >
                                └ {subcategory.name}
                              </button>
                              {subcategory.isTopTrending && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                  ⭐ Trending
                                </span>
                              )}
                            </div>
                            {subcategory.description && (
                              <div className="text-xs text-gray-500">{subcategory.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          Subcategory
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          <button
                            onClick={() => navigateToReportsBySubcategory(category.name, subcategory.name)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                            title={`View ${subcategory.reportCount || 0} reports in this subcategory`}
                          >
                            <BarChart3 className="w-3 h-3" />
                            {subcategory.reportCount || 0} reports
                          </button>
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">Are you sure you want to delete {selectedCategories.length} selected categor{selectedCategories.length === 1 ? 'y' : 'ies'}? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteCategories}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setCategoryForm({ name: '', description: '', subcategories: [] })
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
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingCategory(null)
                  setCategoryForm({ name: '', description: '', subcategories: [] })
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
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectedTop10Categories.includes(industry._id)
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
                  className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${selectedTop10Categories.length === 0
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

      {/* Trending Subcategories Modal */}
      {showTrendingSubcategoriesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                  Top 15 Trending Subcategories
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAllTrendingSubcategories}
                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    {selectedTrendingSubcategories.length === trendingSubcategories.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedTrendingSubcategories.length} selected
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTrendingSubcategoriesModal(false)
                  setSelectedTrendingSubcategories([])
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {trendingSubcategories.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No trending subcategories data available</p>
                  <button
                    onClick={() => {
                      loadTrendingSubcategories()
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Load Trending Data
                  </button>
                </div>
              ) : (
                trendingSubcategories.map((subcategory, index) => (
                  <label
                    key={subcategory._id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectedTrendingSubcategories.includes(subcategory._id)
                      ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-indigo-400 shadow-md'
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTrendingSubcategories.includes(subcategory._id)}
                      onChange={() => handleTrendingSubcategoryToggle(subcategory._id)}
                      className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        {subcategory.isTopTrending && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                            ⭐ Trending
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{subcategory.name}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {subcategory.category.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{subcategory.description}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500">
                            Slug: <code className="bg-gray-100 px-1 rounded">{subcategory.slug}</code>
                          </span>
                          <span className="text-xs text-gray-500">
                            Category: <code className="bg-gray-100 px-1 rounded">{subcategory.category.slug}</code>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600 text-lg">{subcategory.reportCount}</p>
                        <p className="text-xs text-gray-500">reports</p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Select subcategories to mark/unmark as trending. This will save to database.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTrendingSubcategoriesModal(false)
                    setSelectedTrendingSubcategories([])
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMarkTrendingSubcategories(false)}
                  disabled={selectedTrendingSubcategories.length === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Unmark Trending ({selectedTrendingSubcategories.length})
                </button>
                <button
                  onClick={() => handleMarkTrendingSubcategories(true)}
                  disabled={selectedTrendingSubcategories.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Mark as Trending ({selectedTrendingSubcategories.length})
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
