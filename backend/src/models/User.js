import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'editor'], default: 'editor', index: true },
  permissions: {
    reports: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: true },
      edit: { type: Boolean, default: true },
      delete: { type: Boolean, default: true }
    },
    posts: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: true },
      edit: { type: Boolean, default: true },
      delete: { type: Boolean, default: true }
    },
    users: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  }
}, { timestamps: true })

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
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
  
  // Check specific permission for editors
  return this.permissions?.[module]?.[action] || false
}

UserSchema.methods.toSafeJSON = function () {
  const { _id, name, email, role, permissions, createdAt, updatedAt } = this
  return { id: _id.toString(), name, email, role, permissions, createdAt, updatedAt }
}

const User = mongoose.model('User', UserSchema)
export default User
