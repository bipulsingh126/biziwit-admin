import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false })

const PaymentSchema = new mongoose.Schema({
  provider: { type: String, enum: ['stripe', 'paypal'], required: true },
  status: { type: String, enum: ['pending', 'requires_action', 'paid', 'failed', 'refunded'], default: 'pending' },
  currency: { type: String, default: 'usd' },
  amount: { type: Number, required: true, min: 0 },
  stripe: {
    paymentIntentId: String,
    checkoutSessionId: String,
  },
  paypal: {
    orderId: String,
    captureId: String,
  },
}, { _id: false })

const CustomerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  company: String,
}, { _id: false })

const OrderSchema = new mongoose.Schema({
  number: { type: String, unique: true, index: true },
  slug: { type: String, unique: true, lowercase: true, trim: true, index: true },
  items: { type: [OrderItemSchema], default: [] },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['created', 'payment_pending', 'paid', 'failed', 'cancelled'], default: 'created', index: true },
  customer: CustomerSchema,
  payment: PaymentSchema,
  notes: String,
}, { timestamps: true })

OrderSchema.pre('save', function(next) {
  if (!this.number) {
    const ts = Date.now().toString(36)
    const rnd = Math.random().toString(36).slice(2, 6)
    this.number = `BW-${ts}-${rnd}`.toUpperCase()
  }
  
  // Generate slug from order number and customer name
  if (!this.slug) {
    let baseSlug = this.number.toLowerCase()
    if (this.customer?.name) {
      const nameSlug = this.customer.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
      baseSlug = `${baseSlug}-${nameSlug}`
    }
    this.slug = baseSlug
  }
  
  next()
})

export default mongoose.model('Order', OrderSchema)
