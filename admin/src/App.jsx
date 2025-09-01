import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Users from './components/Users'
import Analytics from './components/Analytics'
import Reports from './components/Reports'
import Blog from './components/Blog'
import News from './components/News'
import Megatrends from './components/Megatrends'
import MegatrendDetail from './components/MegatrendDetail'
import CustomReportRequestForm from './components/CustomReportRequestForm'
import CustomReportRequests from './components/CustomReportRequests'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import OrdersPayments from './components/OrdersPayments'
import Inquiries from './components/Inquiries'
import Newsletter from './components/Newsletter'

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Public route: allow access to request-report without login
    if (location.pathname === '/request-report') {
      return <CustomReportRequestForm />
    }
    return <Login />
  }

  return (
    <div className="min-h-screen">
      <div className="flex h-screen bg-gray-50">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header setSidebarOpen={setSidebarOpen} />
          
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <Routes>
                {/* Public route is also available while authenticated */}
                <Route path="/request-report" element={<CustomReportRequestForm />} />
                <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/dashboard' : '/reports'} replace />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute route="/dashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/users" 
                  element={
                    <ProtectedRoute route="/users">
                      <Users />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute route="/analytics">
                      <Analytics />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute route="/orders">
                      <OrdersPayments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute route="/reports">
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/blog" 
                  element={
                    <ProtectedRoute route="/blog">
                      <Blog />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/news" 
                  element={
                    <ProtectedRoute route="/news">
                      <News />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/inquiries" 
                  element={
                    <ProtectedRoute route="/inquiries">
                      <Inquiries />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/newsletter" 
                  element={
                    <ProtectedRoute route="/newsletter">
                      <Newsletter />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/megatrends" 
                  element={
                    <ProtectedRoute route="/megatrends">
                      <Megatrends />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/megatrends/:id" 
                  element={
                    <ProtectedRoute route="/megatrends">
                      <MegatrendDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/custom-reports" 
                  element={
                    <ProtectedRoute route="/custom-reports">
                      <CustomReportRequests />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
