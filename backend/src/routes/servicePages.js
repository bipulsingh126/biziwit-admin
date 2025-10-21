import express from 'express'
import ServicePage from '../models/ServicePage.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Get all service pages
router.get('/', authenticate, async (req, res) => {
  try {
    const { active } = req.query
    
    const query = {}
    if (active !== undefined) {
      query.active = active === 'true'
    }
    
    const servicePages = await ServicePage.find(query).sort({ order: 1, name: 1 })
    
    res.json({
      data: servicePages,
      total: servicePages.length
    })
  } catch (error) {
    console.error('Error fetching service pages:', error)
    res.status(500).json({ error: 'Failed to fetch service pages' })
  }
})

// Get single service page
router.get('/:id', authenticate, async (req, res) => {
  try {
    const servicePage = await ServicePage.findById(req.params.id)
    if (!servicePage) {
      return res.status(404).json({ error: 'Service page not found' })
    }
    res.json(servicePage)
  } catch (error) {
    console.error('Error fetching service page:', error)
    res.status(500).json({ error: 'Failed to fetch service page' })
  }
})

// Create new service page
router.post('/', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const servicePage = new ServicePage(req.body)
    await servicePage.save()
    res.status(201).json(servicePage)
  } catch (error) {
    console.error('Error creating service page:', error)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// Update service page
router.patch('/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const servicePage = await ServicePage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!servicePage) {
      return res.status(404).json({ error: 'Service page not found' })
    }
    
    res.json(servicePage)
  } catch (error) {
    console.error('Error updating service page:', error)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// Delete service page
router.delete('/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const servicePage = await ServicePage.findByIdAndDelete(req.params.id)
    if (!servicePage) {
      return res.status(404).json({ error: 'Service page not found' })
    }
    res.json({ message: 'Service page deleted successfully' })
  } catch (error) {
    console.error('Error deleting service page:', error)
    res.status(500).json({ error: 'Failed to delete service page' })
  }
})

export default router
