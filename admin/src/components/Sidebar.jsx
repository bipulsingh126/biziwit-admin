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
  Folder
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
    { name: 'Home Page Management', href: '/home-page-management', icon: Home },
  ]

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="font-bold text-lg">BiziWit</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {navigation.filter(item => canAccessRoute(item.href)).map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm rounded
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}

export default Sidebar
