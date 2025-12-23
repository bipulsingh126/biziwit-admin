import { useState, useEffect } from 'react'
import { Edit, Trash2, Plus, X, Save } from 'lucide-react'
import api from '../utils/api'

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'editor' })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const result = await api.getUsers({ q: searchTerm })
      setUsers(result.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) loadUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])



  const handleAddUser = () => {
    setShowAddUser(true)
  }

  const handleSaveNewUser = async () => {
    try {
      // Validate email format on frontend
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        setError('Please enter a valid email address')
        return
      }

      // Validate required fields
      if (!newUser.name.trim()) {
        setError('Name is required')
        return
      }

      if (!selectedUser && !newUser.password) {
        setError('Password is required for new users')
        return
      }

      if (selectedUser) {
        await handleUpdateUser()
      } else {
        const userData = {
          name: newUser.name.trim(),
          email: newUser.email.toLowerCase().trim(),
          password: newUser.password,
          role: newUser.role
        }

        await api.createUser(userData)
        await loadUsers()
        setShowAddUser(false)
        setNewUser({ name: '', email: '', password: '', role: 'editor' })
        setError('') // Clear any previous errors
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancelAddUser = () => {
    setShowAddUser(false)
    setNewUser({ name: '', email: '', password: '', role: 'editor' })
    setSelectedUser(null)
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(userId)
        await loadUsers()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleEditUser = (user) => {
    setNewUser({ name: user.name, email: user.email, password: '', role: user.role })
    setSelectedUser(user)
    setShowAddUser(true)
  }

  const handleUpdateUser = async () => {
    try {
      // Validate email format on frontend
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        setError('Please enter a valid email address')
        return
      }

      // Validate required fields
      if (!newUser.name.trim()) {
        setError('Name is required')
        return
      }

      const updateData = {
        name: newUser.name.trim(),
        email: newUser.email.toLowerCase().trim(),
        role: newUser.role
      }
      if (newUser.password) {
        updateData.password = newUser.password
      }
      await api.updateUser(selectedUser._id, updateData)
      await loadUsers()
      setShowAddUser(false)
      setNewUser({ name: '', email: '', password: '', role: 'editor' })
      setSelectedUser(null)
      setError('') // Clear any previous errors
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredUsers = users

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          Error loading users: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded bg-gray-100 capitalize">{user.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-800 text-sm border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 text-sm border border-red-200 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{selectedUser ? 'Edit User' : 'Add New User'}</h2>
              <button
                onClick={handleCancelAddUser}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter valid email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!selectedUser && '*'}
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={selectedUser ? "Leave blank to keep current password" : "Enter secure password"}
                  required={!selectedUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {newUser.role === 'super_admin' && 'Full access to all features including user management'}
                  {newUser.role === 'admin' && 'Full access to content management, no user management'}
                  {newUser.role === 'editor' && 'Access to Reports, Blogs, Megatrends, and Case Studies only'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveNewUser}
                disabled={!newUser.name || !newUser.email || (!selectedUser && !newUser.password)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {selectedUser ? 'Update User' : 'Create User'}
              </button>
              <button
                onClick={handleCancelAddUser}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
