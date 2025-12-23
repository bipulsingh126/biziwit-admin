import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  slug: { type: String, unique: true, lowercase: true, trim: true, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'editor'], default: 'editor', index: true }
}, { timestamps: true })

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Pre-save middleware to generate slug
UserSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }
  next()
})

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

UserSchema.methods.hasPermission = function (module, action) {
  // Super Admin has all permissions
  if (this.role === 'super_admin') return true

  // Regular Admin has all permissions except user management
  if (this.role === 'admin') {
    if (module === 'users') return false
    return true
  }

  // Editor role: hardcoded permissions for specific modules
  if (this.role === 'editor') {
    // Editors have full CRUD access to: reports, posts (blogs), megatrends, caseStudies
    const allowedModules = ['reports', 'posts', 'megatrends', 'caseStudies']
    const allowedActions = ['view', 'create', 'edit', 'delete']

    if (allowedModules.includes(module) && allowedActions.includes(action)) {
      return true
    }
    return false
  }

  return false
}

UserSchema.methods.toSafeJSON = function () {
  const { _id, name, email, role, createdAt, updatedAt } = this
  return { id: _id.toString(), name, email, role, createdAt, updatedAt }
}

const User = mongoose.model('User', UserSchema)
export default User
