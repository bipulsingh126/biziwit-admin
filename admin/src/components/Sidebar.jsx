import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  BarChart3,
  X,
  FileText,
  Edit,
  Inbox,
  TrendingUp,
  Search,
  Folder,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()
  const { user, canAccessRoute } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Categories', href: '/categories', icon: Folder },
    { name: 'SEO Management', href: '/seo-management', icon: Search },
    { name: 'Blog', href: '/blog', icon: Edit },
    { name: 'Megatrends', href: '/admin/megatrends', icon: TrendingUp },
    { name: 'Case Studies', href: '/admin/case-studies', icon: FileText },
    { name: 'Inquiries', href: '/inquiries', icon: Inbox },
    { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
    { name: 'Home Page Management', href: '/home-page-management', icon: Home },
  ]

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
        border-r border-gray-700 shadow-2xl transform transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl text-white tracking-tight">BiziWit</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-144px)] pb-20">
          <div className="space-y-1.5">
            {navigation.filter(item => canAccessRoute(item.href)).map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl
                    transition-all duration-200 ease-in-out relative overflow-hidden
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                  )}

                  {/* Icon */}
                  <Icon className={`
                    w-5 h-5 transition-transform duration-200
                    ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                  `} />

                  {/* Label */}
                  <span className="flex-1">{item.name}</span>

                  {/* Hover effect */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer - User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate capitalize">
                {user?.role?.replace('_', ' ') || 'Role'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
