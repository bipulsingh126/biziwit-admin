import express from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import User from '../models/User.js'
import Order from '../models/Order.js'
import Post from '../models/Post.js'
import Report from '../models/Report.js'
import Inquiry from '../models/Inquiry.js'

const router = express.Router()

// Get analytics data
router.get('/', authenticate, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { range = '7d' } = req.query
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '1d':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get metrics
    const [
      totalUsers,
      newUsers,
      totalOrders,
      newOrders,
      totalRevenue,
      totalPosts,
      newPosts,
      totalInquiries,
      newInquiries
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      Post.countDocuments(),
      Post.countDocuments({ createdAt: { $gte: startDate } }),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ createdAt: { $gte: startDate } })
    ])

    const revenue = totalRevenue[0]?.total || 0

    // Calculate previous period for comparison
    const prevStartDate = new Date(startDate)
    const prevEndDate = new Date(startDate)
    const rangeDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
    prevStartDate.setDate(startDate.getDate() - rangeDays)

    const [
      prevUsers,
      prevOrders,
      prevRevenue,
      prevPosts,
      prevInquiries
    ] = await Promise.all([
      User.countDocuments({ 
        createdAt: { $gte: prevStartDate, $lt: prevEndDate } 
      }),
      Order.countDocuments({ 
        createdAt: { $gte: prevStartDate, $lt: prevEndDate } 
      }),
      Order.aggregate([
        { 
          $match: { 
            status: 'paid',
            createdAt: { $gte: prevStartDate, $lt: prevEndDate }
          } 
        },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      Post.countDocuments({ 
        createdAt: { $gte: prevStartDate, $lt: prevEndDate } 
      }),
      Inquiry.countDocuments({ 
        createdAt: { $gte: prevStartDate, $lt: prevEndDate } 
      })
    ])

    const prevRevenueAmount = prevRevenue[0]?.total || 0

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%'
      const change = ((current - previous) / previous) * 100
      return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
    }

    const metrics = [
      {
        name: 'Total Users',
        value: totalUsers.toLocaleString(),
        change: calculateChange(newUsers, prevUsers)
      },
      {
        name: 'Total Orders',
        value: totalOrders.toLocaleString(),
        change: calculateChange(newOrders, prevOrders)
      },
      {
        name: 'Revenue',
        value: `$${revenue.toLocaleString()}`,
        change: calculateChange(revenue, prevRevenueAmount)
      },
      {
        name: 'Content Posts',
        value: totalPosts.toLocaleString(),
        change: calculateChange(newPosts, prevPosts)
      },
      {
        name: 'Inquiries',
        value: totalInquiries.toLocaleString(),
        change: calculateChange(newInquiries, prevInquiries)
      }
    ]

    // Get top pages (mock data for now - would integrate with actual analytics service)
    const topPages = [
      { page: '/reports', views: 1250, change: '+12.5%' },
      { page: '/megatrends', views: 890, change: '+8.3%' },
      { page: '/blog', views: 650, change: '-2.1%' },
      { page: '/news', views: 420, change: '+15.7%' },
      { page: '/dashboard', views: 380, change: '+5.2%' }
    ]

    res.json({
      metrics,
      topPages,
      range,
      startDate,
      endDate: now
    })

  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics data' })
  }
})

export default router
