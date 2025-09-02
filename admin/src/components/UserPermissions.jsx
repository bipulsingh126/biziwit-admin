import { useState, useEffect } from 'react'
import { Check, X, Save, User } from 'lucide-react'

const UserPermissions = ({ user, onSave, onCancel }) => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [permissions, setPermissions] = useState({
    reports: { view: false, create: false, edit: false, delete: false },
    posts: { view: false, create: false, edit: false, delete: false }
  })

  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions)
    }
    setIsAdmin(user?.role === 'admin')
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
      role: isAdmin ? 'admin' : 'editor',
      permissions: isAdmin ? {} : permissions
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

        {/* Admin Role Toggle */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-lg font-semibold text-blue-800">
                Admin User
              </span>
              <p className="text-sm text-blue-600">
                Admin users have full access to all features. Editors can only manage reports and blog/news.
              </p>
            </div>
          </label>
        </div>

        <div className={`space-y-6 ${isAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
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
            <strong>Note:</strong> {isAdmin ? 'Admin users automatically have all permissions. Individual permissions are disabled.' : 'Editor users can only access Reports and Blog/News management.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserPermissions
