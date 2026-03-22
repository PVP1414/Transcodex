import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    width: Number,
    height: Number,
    size: Number,
    format: String,
  },
  { _id: false }
);

const mediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      path: String,
      url: String,
    },
    dimensions: {
      width: Number,
      height: Number,
    },
    duration: Number,
    variants: [variantSchema],
    access: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

mediaSchema.index({ user: 1, createdAt: -1 });
mediaSchema.index({ access: 1 });
mediaSchema.index({ mediaType: 1 });

const Media = mongoose.model('Media', mediaSchema);

export default Media;
