import { useState, useEffect } from 'react'
import { Check, X, Save, User } from 'lucide-react'

const UserPermissions = ({ user, onSave, onCancel }) => {
  const [role, setRole] = useState('editor')
  const [permissions, setPermissions] = useState({
    reports: { view: false, create: false, edit: false, delete: false },
    posts: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    caseStudies: { view: false, create: false, edit: false, delete: false },
    megatrends: { view: false, create: false, edit: false, delete: false }
  })

  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions)
    } else {
      // Default permissions for new users or if missing
      setPermissions({
        reports: { view: false, create: false, edit: false, delete: false },
        posts: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        caseStudies: { view: false, create: false, edit: false, delete: false },
        megatrends: { view: false, create: false, edit: false, delete: false }
      })
    }
    setRole(user?.role || 'editor')
  }, [user])

  const handlePermissionChange = (module, action, value) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value
      }
    }))
  }

  const handleSave = () => {
    const updatedUser = {
      ...user,
      role: role,
      permissions: (role === 'super_admin' || role === 'admin') ? {} : permissions
    }
    onSave(updatedUser)
  }

  const permissionModules = [
    {
      name: 'reports',
      label: 'Reports',
      actions: ['view', 'create', 'edit', 'delete']
    },
    {
      name: 'posts',
      label: 'Blog & News',
      actions: ['view', 'create', 'edit', 'delete']
    },
    {
      name: 'users',
      label: 'User Management',
      actions: ['view', 'create', 'edit', 'delete']
    },
    {
      name: 'caseStudies',
      label: 'Case Studies',
      actions: ['view', 'create', 'edit', 'delete']
    },
    {
      name: 'megatrends',
      label: 'Megatrends',
      actions: ['view', 'create', 'edit', 'delete']
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">User Permissions</h2>
              <p className="text-gray-600">{user?.name} ({user?.email})</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">User Role</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="editor"
                checked={role === 'editor'}
                onChange={(e) => setRole(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-800">Editor</span>
                <p className="text-sm text-gray-600">Custom permissions for specific modules</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === 'admin'}
                onChange={(e) => setRole(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-800">Admin</span>
                <p className="text-sm text-gray-600">Full access to content management (reports, posts) but no user management</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="super_admin"
                checked={role === 'super_admin'}
                onChange={(e) => setRole(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-800">Super Admin</span>
                <p className="text-sm text-gray-600">Full access to all features including user management</p>
              </div>
            </label>
          </div>
        </div>

        <div className={`space-y-6 ${(role === 'admin' || role === 'super_admin') ? 'opacity-50 pointer-events-none' : ''}`}>
          {permissionModules.map((module) => (
            <div key={module.name} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">
                {module.label}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {module.actions.map((action) => (
                  <label
                    key={action}
                    className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[module.name]?.[action] || false}
                      onChange={(e) => handlePermissionChange(module.name, action, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium capitalize">
                      {action}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> {
              role === 'super_admin' ? 'Super Admin users have full access to all features including user management.' :
                role === 'admin' ? 'Admin users have full access to content management but cannot manage users or permissions.' :
                  'Editor users can access modules based on assigned permissions below.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserPermissions
