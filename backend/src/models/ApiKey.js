import mongoose from 'mongoose';
import crypto from 'crypto';

export function generateApiKey() {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `mhs_${randomBytes}`;
}

const apiKeySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  permissions: {
    type: String,
    enum: ['read', 'read-write', 'admin'],
    default: 'read',
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  lastUsedAt: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

apiKeySchema.index({ user: 1, createdAt: -1 });

apiKeySchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

apiKeySchema.methods.mask = function () {
  if (!this.key || this.key.length < 8) return '****';
  return `${this.key.slice(0, 4)}...${this.key.slice(-4)}`;
};

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

export default ApiKey;
