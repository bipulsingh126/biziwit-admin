import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor'], default: 'editor', index: true },
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
  // Admin has all permissions
  if (this.role === 'admin') return true
  
  // Check specific permission
  return this.permissions?.[module]?.[action] || false
}

UserSchema.methods.toSafeJSON = function () {
  const { _id, name, email, role, permissions, createdAt, updatedAt } = this
  return { id: _id.toString(), name, email, role, permissions, createdAt, updatedAt }
}

const User = mongoose.model('User', UserSchema)
export default User
