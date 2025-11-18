import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Users from './components/Users'
import Analytics from './components/Analytics'
import Reports from './components/Reports'
import ReportCreate from './components/ReportCreate'
import SEOManagement from './components/SEOManagement'
import Blog from './components/Blog'
import Megatrends from './components/Megatrends'
import MegatrendCreate from './components/MegatrendCreate'
import MegatrendDetail from './components/MegatrendDetail'
import CaseStudies from './components/CaseStudies'
import CaseStudyCreate from './components/CaseStudyCreate'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Inquiries from './components/Inquiries'
import Categories from './components/Categories'
import HomePageManagement from './components/HomePageManagement'
import Testimonial from './components/Testimonial'

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
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
                  path="/reports" 
                  element={
                    <ProtectedRoute route="/reports">
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports/create" 
                  element={
                    <ProtectedRoute route="/reports">
                      <ReportCreate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports/:id/edit" 
                  element={
                    <ProtectedRoute route="/reports">
                      <ReportCreate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/seo-management" 
                  element={
                    <ProtectedRoute route="/seo-management">
                      <SEOManagement />
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
                  path="/inquiries" 
                  element={
                    <ProtectedRoute route="/inquiries">
                      <Inquiries />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/categories" 
                  element={
                    <ProtectedRoute route="/categories">
                      <Categories />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/megatrends" 
                  element={
                    <ProtectedRoute route="/megatrends">
                      <Megatrends />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/megatrends/create" 
                  element={
                    <ProtectedRoute route="/megatrends">
                      <MegatrendCreate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/megatrends/:id/edit" 
                  element={
                    <ProtectedRoute route="/megatrends">
                      <MegatrendCreate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/megatrends/:id" 
                  element={
                    <ProtectedRoute route="/megatrends">
                      <MegatrendDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/case-studies" 
                  element={
                    <ProtectedRoute route="/case-studies">
                      <CaseStudies />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/case-studies/create" 
                  element={
                    <ProtectedRoute route="/case-studies">
                      <CaseStudyCreate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/case-studies/:id/edit" 
                  element={
                    <ProtectedRoute route="/case-studies">
                      <CaseStudyCreate />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/home-page-management" 
                  element={
                    <ProtectedRoute route="/home-page-management">
                      <HomePageManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/testimonials" 
                  element={
                    <ProtectedRoute route="/testimonials">
                      <Testimonial />
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
  useEffect(() => {
    // Global error handler to suppress browser extension errors
    const handleError = (event) => {
      // Suppress browser extension errors
      if (event.message && (
        event.message.includes('Cannot find menu item') ||
        event.message.includes('chrome-extension') ||
        event.message.includes('moz-extension') ||
        event.message.includes('safari-extension') ||
        event.filename && event.filename.includes('extension')
      )) {
        console.warn('Browser extension error suppressed:', event.message)
        event.preventDefault()
        return false
      }
    }

    const handleUnhandledRejection = (event) => {
      // Suppress API 404 errors for trending endpoints
      if (event.reason && event.reason.message && 
          event.reason.message.includes('404') && 
          event.reason.message.includes('trending')) {
        console.warn('Trending API endpoint not available:', event.reason.message)
        event.preventDefault()
        return false
      }
    }

    // Add global error listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
