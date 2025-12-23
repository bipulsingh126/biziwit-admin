import mongoose from 'mongoose'

const LoginHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true },
    role: { type: String },
    action: { type: String, enum: ['login', 'logout'], default: 'login' },
    ip: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
})

LoginHistorySchema.index({ timestamp: -1 })

const LoginHistory = mongoose.model('LoginHistory', LoginHistorySchema)
export default LoginHistory
