import { Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Header = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="ml-4 text-lg font-semibold">BiziWit Admin</h2>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Welcome, {user?.name || 'User'}</span>
          <button 
            onClick={logout}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
