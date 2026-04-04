# Media Management System

## Overview

A full-stack media management system built with the MERN stack that enables users to upload, store, optimize, and deliver images and videos via API with access control.

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Document database (via Mongoose ODM)
- **Multer** - File upload handling
- **Sharp** - Image optimization/processing
- **Morgan** - HTTP request logging

### Infrastructure
- **Storage Adapter Pattern** - Pluggable storage (local/cloud-ready)

## Design Decisions

| Decision | Choice |
|----------|--------|
| Storage | Local filesystem with cloud-ready abstraction layer |
| Authentication | Full auth system (JWT + RBAC) |
| Media Types | Images + Videos |
| Frontend Features | Upload, gallery, preview, admin dashboard |
| Approach | Incremental/parallel (sprint-based) |

## Architecture

```
├── frontend/                      # React application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── MediaCard.jsx    # Media item card
│   │   │   ├── MediaGallery.jsx  # Grid layout gallery
│   │   │   ├── MediaPreview.jsx # Lightbox/video player
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Upload.jsx        # Drag & drop upload
│   │   ├── context/              # React context
│   │   │   └── AuthContext.jsx   # Authentication state
│   │   ├── pages/                # Route pages
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── Login.jsx         # Login page
│   │   │   └── Register.jsx      # Registration page
│   │   ├── services/             # API services
│   │   │   └── api.js            # Axios configuration
│   │   ├── App.jsx               # Root component
│   │   └── main.jsx              # Entry point
│   └── dist/                     # Production build
├── backend/                      # Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # MongoDB connection
│   │   ├── controllers/
│   │   │   └── media.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js # JWT authentication
│   │   │   └── upload.middleware.js
│   │   ├── models/
│   │   │   ├── User.js           # User schema
│   │   │   └── Media.js          # Media schema
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── media.routes.js
│   │   ├── services/
│   │   │   └── storage/          # Storage abstraction
│   │   │       ├── index.js      # Factory pattern
│   │   │       ├── StorageInterface.js
│   │   │       └── LocalAdapter.js
│   │   └── server.js             # Entry point
│   ├── uploads/                   # Local file storage
│   │   ├── images/
│   │   ├── videos/
│   │   ├── thumbnails/
│   │   └── variants/
│   └── .env                       # Environment variables
├── local-packages/                # Shared packages (future)
└── context/                      # Project documentation
```

## Implementation Plan

### Sprint 1: Foundation ✓
- [x] Storage abstraction layer (interface + LocalAdapter)
- [x] MongoDB models (User, Media)
- [x] Express server structure
- [x] Install dependencies (multer, sharp, bcrypt, jsonwebtoken, morgan)

### Sprint 2: Authentication ✓
- [x] User model with password hashing (bcrypt)
- [x] User registration endpoint
- [x] User login endpoint
- [x] JWT middleware
- [x] Role-based access control (user, admin)

### Sprint 3: Media Upload ✓
- [x] Multer configuration for images/videos
- [x] Image upload with Sharp optimization
- [x] Generate thumbnails (200x200 WebP)
- [x] Generate variants (small, medium, large)
- [x] Video upload handling (infrastructure ready)
- [x] Media model CRUD operations

### Sprint 4: Media Delivery ✓
- [x] Serve optimized media via URL
- [x] Access control (public/private)
- [x] Delete media endpoint (removes file + DB record)
- [x] Update media metadata endpoint

### Sprint 5: Frontend ✓
- [x] Upload interface with drag & drop
- [x] Media gallery with responsive grid view
- [x] File preview (image lightbox, video player)
- [x] Admin dashboard with tabs
- [x] Authentication UI (login/register)
- [x] Tailwind CSS styling

## Data Models

### User
```javascript
{
  username: String,     // Unique, 3-30 chars
  email: String,        // Unique, lowercase
  password: String,     // Hashed with bcrypt
  role: String,         // 'user' | 'admin'
  createdAt: Date,
  updatedAt: Date
}
```

### Media
```javascript
{
  filename: String,      // Stored filename
  originalName: String,   // Display name
  mimeType: String,      // e.g., 'image/png'
  mediaType: String,     // 'image' | 'video'
  size: Number,          // Bytes
  path: String,          // Storage path
  url: String,           // Public URL
  thumbnail: {
    path: String,
    url: String
  },
  dimensions: {
    width: Number,
    height: Number
  },
  variants: [{
    name: String,        // 'small' | 'medium' | 'large'
    path: String,
    url: String,
    width: Number,
    height: Number,
    size: Number,
    format: String
  }],
  access: String,        // 'public' | 'private'
  user: ObjectId,       // Owner reference
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Media

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/media/upload` | Upload single file | Yes |
| GET | `/api/media` | List user's media | Yes |
| GET | `/api/media/:id` | Get media details | Yes |
| GET | `/api/media/:id/serve` | Serve media file | No |
| PUT | `/api/media/:id` | Update metadata | Yes |
| DELETE | `/api/media/:id` | Delete media | Yes |

## Features

### Implemented ✅

1. **User Authentication**
   - Registration with username/email/password
   - Login with JWT token
   - Password hashing with bcrypt
   - Token-based session management

2. **Media Upload**
   - Drag & drop interface
   - File type validation (images & videos)
   - Size limit (50MB)
   - Progress indicator

3. **Image Optimization**
   - Automatic thumbnail generation (200x200 WebP)
   - Responsive variants (480px, 800px, 1200px)
   - WebP format conversion
   - Metadata extraction (dimensions)

4. **Media Management**
   - Grid gallery view
   - Filter by type (image/video)
   - Filter by access (public/private)
   - Pagination
   - Toggle public/private access
   - Delete with confirmation

5. **Media Preview**
   - Image lightbox with zoom
   - HLS video player with adaptive streaming
   - Quality selector (360p/480p/720p/1080p)
   - Download functionality
   - ESC key to close

6. **Video Streaming (HLS)**
   - Adaptive bitrate streaming
   - Multiple quality variants (360p, 480p, 720p, 1080p)
   - FFmpeg transcoding to HLS format
   - hls.js player integration
   - Real-time transcoding status
   - Authenticated streaming endpoints

7. **Storage Abstraction**
   - Pluggable storage adapters
   - Local filesystem adapter implemented
   - Cloud-ready architecture (S3, Cloudinary ready)

### Future Features ⏳

- [ ] Bulk upload support
- [ ] S3 adapter integration
- [ ] Cloudinary adapter integration
- [ ] Media categorization/folders
- [ ] Search and filtering
- [ ] Usage analytics
- [ ] Admin dashboard (user management)
- [ ] Image compression settings
- [ ] Watermark support

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/media-management-system
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
STORAGE_TYPE=local
MAX_FILE_SIZE=52428800
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_MEDIA_URL=http://localhost:5000
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- pnpm

### Installation
```bash
# Install dependencies
pnpm install

# Start backend
cd backend && pnpm dev

# Start frontend
cd frontend && pnpm dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health
