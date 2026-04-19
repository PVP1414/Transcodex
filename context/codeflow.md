# Code Flow Documentation - MediaHub

This is a comprehensive guide to understanding the code flow of MediaHub, a full-stack media management application.

---

## Table of Contents

1. [Application Type](#1-application-type)
2. [Directory Structure](#2-directory-structure)
3. [Main Entry Points](#3-main-entry-points)
4. [Data Flow Through the Application](#4-data-flow-through-the-application)
5. [Key Components and Their Relationships](#5-key-components-and-their-relationships)
6. [API Routes and Structure](#6-api-routes-and-structure)
7. [Database Models](#7-database-models)
8. [Authentication Flow](#8-authentication-flow)
9. [State Management Approach](#9-state-management-approach)
10. [Image Processing Pipeline](#10-image-processing-pipeline)
11. [Storage Adapter Pattern](#11-storage-adapter-pattern)
12. [File Upload to Response Flow](#12-file-upload-to-response-flow)
13. [Environment Configuration](#13-environment-configuration)
14. [Summary](#14-summary)

---

## 1. Application Type

**This is a FULL-STACK MERN (MongoDB, Express, React, Node.js) application** structured as a **monorepo** using pnpm workspaces.

### Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, React Router 7, Axios |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt password hashing |
| **Image Processing** | Sharp (thumbnails, variants, WebP conversion) |
| **File Handling** | Multer |
| **Logging** | Morgan |

---

## 2. Directory Structure

```
AWT-Project-Media-Managemenent-System/
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection
│   │   ├── controllers/
│   │   │   └── media.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── upload.middleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Media.js
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── media.routes.js
│   │   ├── services/
│   │   │   └── storage/       # Adapter Pattern Implementation
│   │   │       ├── index.js
│   │   │       ├── StorageInterface.js
│   │   │       └── LocalAdapter.js
│   │   └── server.js          # Entry point
│   ├── uploads/               # Local file storage
│   └── .env
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── MediaGallery.jsx
│   │   │   ├── MediaCard.jsx
│   │   │   ├── MediaPreview.jsx
│   │   │   ├── Stats.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/           # React Context (State Management)
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── GalleryPage.jsx
│   │   │   └── Docs.jsx
│   │   ├── services/
│   │   │   └── api.js        # Axios API client
│   │   ├── App.jsx           # Main app with routing
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Tailwind CSS imports
│   ├── .env
│   └── vite.config.js
│
├── local-packages/             # Reserved for shared packages
├── context/                   # Project documentation
└── package.json               # Root workspace config
```

---

## 3. Main Entry Points

### Backend Entry Point (`backend/src/server.js`)

```javascript
// Key initialization flow:
1. Load environment variables (dotenv)
2. Connect to MongoDB (connectDB())
3. Create Express app
4. Apply middleware (cors, json, urlencoded, morgan)
5. Mount static file serving for /uploads
6. Register routes (/api/auth, /api/media)
7. Health check endpoint (/api/health)
8. Error handling middleware
9. Start server on PORT
```

### Frontend Entry Point (`frontend/src/main.jsx`)

```javascript
// React 19 entry point:
1. Import main CSS (Tailwind)
2. Create root with createRoot()
3. Render App inside StrictMode
```

---

## 4. Data Flow Through the Application

### Complete Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐       │
│  │  Login/  │───▶│ AuthContext│───▶│  API    │───▶│  Backend Server  │       │
│  │ Register │    │ (stores   │    │ Service  │    │                  │       │
│  │   Page   │    │  user/    │    │ (Axios) │    │  POST /api/auth  │       │
│  └──────────┘    │  token)   │    └──────────┘    │  /login          │       │
│       │          └──────────┘         │          └────────┬─────────┘       │
│       │               │               │                   │                 │
│       ▼               ▼               ▼                   ▼                 │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                    JWT Token Storage                        │           │
│  │              localStorage.setItem('token', ...)            │           │
│  └─────────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVER                                    │
│                                                                             │
│   ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐              │
│   │  middleware │───▶│   routes/    │───▶│   controllers/   │              │
│   │ (auth,      │    │  auth.routes │    │  media.controller│              │
│   │  upload)    │    │  media.routes│    │                 │              │
│   └─────────────┘    └──────────────┘    └────────┬────────┘              │
│         │                  │                     │                         │
│         ▼                  ▼                     ▼                         │
│   ┌────────────────────────────────────────────────────────────┐          │
│   │                    Mongoose Models                         │          │
│   │                   User.js, Media.js                         │          │
│   └────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│   ┌────────────────────────────────────────────────────────────┐          │
│   │                  MongoDB Database                           │          │
│   │               (media-management-system)                     │          │
│   └────────────────────────────────────────────────────────────┘          │
│                                                                             │
│   ┌────────────────────────────────────────────────────────────┐          │
│   │              Storage Service (Adapter Pattern)              │          │
│   │           LocalAdapter → File System /uploads/             │          │
│   └────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Key Components and Their Relationships

### Frontend Architecture

```
App.jsx (Root)
    │
    ├── AuthProvider (Context)
    │   └── Provides: user, login, register, logout
    │
    ├── ToastProvider (Context)
    │   └── Provides: success, error, warning, info, addToast
    │
    └── BrowserRouter
            │
            ├── /login → Login.jsx
            ├── /register → Register.jsx
            │
            └── ProtectedRoute Wrappers:
                │
                ├── / → Dashboard.jsx
                │       ├── Layout (Sidebar + Header)
                │       ├── Stats (media statistics)
                │       ├── Upload (drag & drop)
                │       └── MediaGallery (grid of cards)
                │
                ├── /upload → UploadPage.jsx
                │       ├── Layout
                │       └── Upload (full upload page)
                │
                ├── /gallery → GalleryPage.jsx
                │       ├── Layout
                │       └── MediaGallery (filterable)
                │
                └── /docs → Docs.jsx (Documentation)
```

### Component Hierarchy

```
Layout
├── Sidebar (navigation)
└── Header (sticky top bar)
    └── Page Content (children)

Dashboard/UploadPage/GalleryPage
├── Stats (optional)
├── Upload (drag & drop)
├── MediaGallery
│   └── MediaCard[] (media items)
│       └── MediaPreview (modal)
└── MediaPreview (lightbox modal)
```

---

## 6. API Routes and Structure

### Backend API Structure

```
Base URL: http://localhost:5000/api

┌─────────────────────────────────────────────────────────────────────────────┐
│  AUTH ROUTES (/api/auth)                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST /register          Register new user                                  │
│  POST /login             Login and get JWT token                            │
│  GET  /me                Get current authenticated user (Auth required)      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  MEDIA ROUTES (/api/media)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST   /upload             Upload single file (Auth required)             │
│  GET    /                   List user's media (Auth required)              │
│  GET    /public             List public media (No auth)                    │
│  GET    /:id                Get media details (Auth required)              │
│  GET    /:id/serve          Serve media file (Streaming)                   │
│  PUT    /:id                Update metadata (Auth required)                │
│  DELETE /:id                Delete media (Auth required)                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  HEALTH CHECK                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  GET  /api/health           Server health status                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request/Response Examples

**Register:**

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}

Response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "johndoe", "email": "...", "role": "user" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Upload:**

```http
POST /api/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
access: public

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "filename": "images/1234567890-photo.jpg",
    "originalName": "photo.jpg",
    "mediaType": "image",
    "size": 1234567,
    "thumbnail": { "path": "thumbnails/photo-thumb.webp", "url": "/uploads/thumbnails/..." },
    "variants": [{ "name": "small", "url": "/uploads/variants/..." }, ...],
    "access": "public",
    "user": "..."
  }
}
```

---

## 7. Database Models

### User Model (`backend/src/models/User.js`)

```javascript
{
  username: String,      // Required, unique, 3-30 chars
  email: String,         // Required, unique, lowercase, validated
  password: String,      // Required, hashed with bcrypt, min 6 chars
  role: String,          // Enum: ['user', 'admin'], default: 'user'
  createdAt: Date,      // Auto-managed by Mongoose
  updatedAt: Date        // Auto-managed by Mongoose
}

// Instance Methods:
// - comparePassword(candidatePassword) → Boolean
// - generateAuthToken() → JWT string
```

### Media Model (`backend/src/models/Media.js`)

```javascript
{
  filename: String,       // Stored filename
  originalName: String,   // User's original filename
  mimeType: String,      // e.g., 'image/jpeg'
  mediaType: String,      // Enum: ['image', 'video']
  size: Number,           // File size in bytes
  path: String,          // Storage path
  url: String,           // Public URL
  thumbnail: {
    path: String,
    url: String
  },
  dimensions: {          // For images
    width: Number,
    height: Number
  },
  duration: Number,      // For videos (future)
  variants: [{
    name: String,        // 'small' | 'medium' | 'large'
    path: String,
    url: String,
    width: Number,
    height: Number,
    size: Number,
    format: String
  }],
  access: String,        // Enum: ['public', 'private'], default: 'private'
  user: ObjectId,         // Reference to User (owner)
  
  // Indexes for performance:
  // { user: 1, createdAt: -1 }
  // { access: 1 }
  // { mediaType: 1 }
}
```

---

## 8. Authentication Flow

### Login Flow

```
1. User enters email/password on Login.jsx
           │
           ▼
2. AuthContext.login() called
           │
           ▼
3. API call: POST /api/auth/login
           │
           ▼
4. Backend validates credentials:
   - Find user by email
   - Compare password with bcrypt
   - Generate JWT token
           │
           ▼
5. Response: { user, token }
           │
           ▼
6. Store in localStorage:
   - localStorage.setItem('token', token)
   - localStorage.setItem('user', JSON.stringify(user))
           │
           ▼
7. Set user state in AuthContext
           │
           ▼
8. Redirect to Dashboard
```

### Protected Route Flow

```
Request to protected route
         │
         ▼
ProtectedRoute.jsx checks AuthContext.user
         │
    ┌────┴────┐
    │         │
  user?    no user?
    │         │
    ▼         ▼
Render     Redirect to
children   /login
```

### API Request Authentication

```
Every API call (via Axios interceptor):
         │
         ▼
axios.interceptors.request.use()
         │
         ▼
Read token from localStorage
         │
         ▼
Add to header:
Authorization: Bearer <token>
         │
         ▼
Send request
```

### Backend Token Validation

```
Request with Authorization header
         │
         ▼
authenticate middleware
         │
         ▼
Extract Bearer token
         │
         ▼
jwt.verify(token, SECRET)
         │
         ▼
Find user in database
         │
         ▼
Attach user to req.user
         │
         ▼
Continue to controller
```

---

## 9. State Management Approach

### Context API (No Redux/Pinia)

The app uses React's Context API for global state:

#### 1. AuthContext (`frontend/src/context/AuthContext.jsx`)

```javascript
// State:
- user: User | null        // Current logged-in user
- loading: boolean         // Initial auth check loading

// Actions:
- login(email, password)    // Returns user
- register(username, email, password)  // Returns user
- logout()                  // Clears state
```

**Initial Load Logic:**

```javascript
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    // Try to validate token with server
    authService.getMe()
      .then(res => setUser(res.data.data))
      .catch(() => logout())  // Token invalid
  }
}, []);
```

#### 2. ToastContext (`frontend/src/context/ToastContext.jsx`)

```javascript
// State:
- toasts: Array<{ id, message, type }>

// Actions:
- success(message, duration)
- error(message, duration)
- warning(message, duration)
- info(message, duration)
- addToast(message, type, duration)
- removeToast(id)
```

---

## 10. Image Processing Pipeline

When an image is uploaded, Sharp processes it:

```
┌────────────────────────────────────────────────────────────────┐
│                    IMAGE UPLOAD PIPELINE                        │
└────────────────────────────────────────────────────────────────┘

Original Image Upload
         │
         ▼
┌─────────────────┐
│ Validate file   │ ─── Reject if not image/video
│ type & size     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract metadata│ ─── Get width, height via Sharp
│ (Sharp.metadata)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create thumbnail│ ─── 200x200 WebP (quality: 80)
│                 │     /uploads/thumbnails/[name]-thumb.webp
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create variants │ ─── If width > threshold:
│                 │     - small: 480px
│                 │     - medium: 800px  
│                 │     - large: 1200px
│                 │     All converted to WebP
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Move to storage │ ─── LocalAdapter.upload()
│                 │     /uploads/images/[timestamp]-[filename]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create DB record│ ─── Media.create({...})
│                 │
└────────┬────────┘
         │
         ▼
      Return response
```

---

## 11. Storage Adapter Pattern

The app uses the **Adapter Pattern** for storage, making it cloud-ready:

```
┌──────────────────────────────────────────────────────────────┐
│                    Storage Architecture                       │
└──────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │    index.js     │
                    │  (Factory)      │
                    └────────┬────────┘
                             │
              STORAGE_TYPE env variable
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
┌─────────────────┐                   ┌─────────────────┐
│  LocalAdapter   │                   │   (Future)      │
│                 │                   │   S3Adapter     │
│  - Disk storage │                   │   CloudAdapter  │
│  - /uploads/    │                   │                 │
└─────────────────┘                   └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  StorageInterface                            │
│  (Abstract base class)                                       │
├─────────────────────────────────────────────────────────────┤
│  + upload(file, options)    // Store a file                │
│  + delete(path)             // Remove a file                │
│  + getUrl(path)             // Get public URL               │
│  + serve(path, res)         // Stream to response          │
│  + exists(path)             // Check if file exists        │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. File Upload to Response Flow

Complete flow for uploading an image:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. User Interaction                                                          │
│    User drags image onto Upload component or clicks to select file           │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Frontend Upload (Upload.jsx)                                             │
│    - Create FormData                                                         │
│    - Append file and access type                                             │
│    - Call mediaService.upload(formData)                                      │
│    - Axios sends multipart/form-data request                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Backend: Multer Middleware (upload.middleware.js)                        │
│    - Parse multipart/form-data                                               │
│    - Store file temporarily in /uploads/temp/                                │
│    - Attach file info to req.file                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Backend: Media Controller (media.controller.js - uploadMedia)           │
│    - Validate file type (image/video) and size (max 50MB)                   │
│    - For images:                                                            │
│      a. Get metadata via Sharp (dimensions)                                 │
│      b. Create thumbnail (200x200 WebP)                                     │
│      c. Create responsive variants (480, 800, 1200px)                       │
│    - Upload to storage (LocalAdapter)                                       │
│    - Create Media document in MongoDB                                        │
│    - Return created media object                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Frontend: Handle Response                                                 │
│    - Call onUploadComplete callback                                         │
│    - Show success toast notification                                        │
│    - Refresh gallery if needed (setRefreshTrigger)                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Environment Configuration

### Backend (.env)

```bash
PORT=5000                                    # Server port
MONGODB_URI=mongodb://localhost:27017/...   # Database connection
JWT_SECRET=your-secret-key                   # Token signing secret
JWT_EXPIRES_IN=7d                            # Token expiry
STORAGE_TYPE=local                          # Storage adapter
MAX_FILE_SIZE=52428800                       # 50MB in bytes
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5000/api      # Backend API base URL
VITE_MEDIA_URL=http://localhost:5000        # Media server URL
```

---

## 14. Summary

This is a well-structured **full-stack media management application** that demonstrates:

1. **Clean Architecture** - Separation of concerns with routes, controllers, models, and services
2. **Security** - JWT authentication, password hashing, protected routes
3. **Image Processing** - Automated optimization with Sharp (thumbnails, variants, WebP)
4. **Scalable Design** - Storage adapter pattern for future cloud integration
5. **Modern React** - Context API for state, hooks, functional components
6. **Responsive UI** - Tailwind CSS with mobile-first design
7. **Good UX** - Toast notifications, loading states, drag & drop, preview modals

The codebase is production-ready for a v1.0 with solid fundamentals that can be extended with features like S3 storage, bulk uploads, admin dashboard, and video transcoding.
