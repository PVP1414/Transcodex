import { useState } from 'react';
import Layout from '../components/Layout';

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'api', label: 'API Reference' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'media-processing', label: 'Media Processing' },
  ];

  return (
    <Layout title="Documentation">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Contents</h3>
            <ul className="space-y-2">
              {sections.map(section => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-4xl">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'getting-started' && <GettingStartedSection />}
          {activeSection === 'authentication' && <AuthenticationSection />}
          {activeSection === 'api' && <APISection />}
          {activeSection === 'architecture' && <ArchitectureSection />}
          {activeSection === 'media-processing' && <MediaProcessingSection />}
        </div>
      </div>
    </Layout>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-2xl font-bold text-gray-800 mb-4">{children}</h2>;
}

function SectionParagraph({ children }) {
  return <p className="text-gray-600 leading-relaxed mb-4">{children}</p>;
}

function CodeBlock({ children, language = 'bash' }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto">
      <code className="text-sm text-gray-100 font-mono">{children}</code>
    </div>
  );
}

function OverviewSection() {
  return (
    <div>
      <SectionTitle>Overview</SectionTitle>
      <SectionParagraph>
        MediaHub is a full-stack media management system built with the MERN stack (MongoDB, Express, React, Node.js). It provides a complete solution for uploading, storing, optimizing, and delivering images and videos via a RESTful API.
      </SectionParagraph>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Key Features</h3>
      <ul className="space-y-2 text-gray-600">
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-1">•</span>
          <span><strong>Media Upload</strong> - Drag & drop interface for images and videos</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-1">•</span>
          <span><strong>Image Optimization</strong> - Automatic thumbnails, WebP conversion, responsive variants</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-1">•</span>
          <span><strong>Access Control</strong> - Public/private media with authentication</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-1">•</span>
          <span><strong>Storage Abstraction</strong> - Pluggable storage adapters (local, S3, Cloudinary)</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo-500 mt-1">•</span>
          <span><strong>RESTful API</strong> - Complete API for programmatic access</span>
        </li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Tech Stack</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Frontend</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>React 19</li>
            <li>Vite</li>
            <li>Tailwind CSS</li>
            <li>React Router</li>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Backend</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Node.js / Express</li>
            <li>MongoDB (Mongoose)</li>
            <li>Multer (file uploads)</li>
            <li>Sharp (image processing)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function GettingStartedSection() {
  return (
    <div>
      <SectionTitle>Getting Started</SectionTitle>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Prerequisites</h3>
      <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
        <li>Node.js 18+</li>
        <li>MongoDB (local or Atlas)</li>
        <li>pnpm (recommended) or npm</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Installation</h3>
      <SectionParagraph>Clone the repository and install dependencies:</SectionParagraph>
      <CodeBlock>{`git clone <repo-url>
cd AWT-Project-Media-Managemenent-System
pnpm install`}</CodeBlock>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Configuration</h3>
      <SectionParagraph>Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the backend directory:</SectionParagraph>
      <CodeBlock>{`PORT=5000
MONGODB_URI=mongodb://localhost:27017/media-management-system
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
STORAGE_TYPE=local`}</CodeBlock>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Running the Application</h3>
      <div className="space-y-3">
        <div>
          <p className="font-medium text-gray-800">Start Backend:</p>
          <CodeBlock>{`cd backend
pnpm dev`}</CodeBlock>
        </div>
        <div>
          <p className="font-medium text-gray-800">Start Frontend:</p>
          <CodeBlock>{`cd frontend
pnpm dev`}</CodeBlock>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-800 font-medium">Access Points:</p>
        <ul className="text-green-700 mt-2 space-y-1">
          <li>Frontend: <code>http://localhost:5173</code></li>
          <li>Backend API: <code>http://localhost:5000</code></li>
          <li>Health Check: <code>http://localhost:5000/api/health</code></li>
        </ul>
      </div>
    </div>
  );
}

function AuthenticationSection() {
  return (
    <div>
      <SectionTitle>Authentication</SectionTitle>
      <SectionParagraph>
        The system uses JWT (JSON Web Tokens) for authentication. When a user logs in, they receive a token that must be included in subsequent requests.
      </SectionParagraph>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">How It Works</h3>
      <ol className="list-decimal list-inside text-gray-600 space-y-2">
        <li>User registers or logs in with credentials</li>
        <li>Server returns a JWT token</li>
        <li>Token is stored in localStorage</li>
        <li>Token is sent with each API request in Authorization header</li>
        <li>Server validates token and identifies user</li>
      </ol>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Using the Token</h3>
      <SectionParagraph>Include the token in the Authorization header:</SectionParagraph>
      <CodeBlock>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</CodeBlock>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Token Expiry</h3>
      <p className="text-gray-600">Tokens expire after 7 days by default. Users need to log in again after expiry.</p>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-yellow-800 font-medium">Security Note:</p>
        <p className="text-yellow-700 mt-2">
          In production, consider using httpOnly cookies instead of localStorage for better security against XSS attacks.
        </p>
      </div>
    </div>
  );
}

function APISection() {
  return (
    <div>
      <SectionTitle>API Reference</SectionTitle>
      <SectionParagraph>
        All API endpoints are prefixed with <code className="bg-gray-100 px-1 rounded">/api</code>.
      </SectionParagraph>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Base URL</h3>
      <CodeBlock>http://localhost:5000/api</CodeBlock>

      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">Authentication Endpoints</h3>
      
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">POST</span>
            <code className="text-sm font-mono">/auth/register</code>
          </div>
          <p className="text-gray-600 text-sm mb-3">Register a new user account</p>
          <p className="text-gray-500 text-xs mb-2">Request Body:</p>
          <CodeBlock>{`{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}`}</CodeBlock>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">POST</span>
            <code className="text-sm font-mono">/auth/login</code>
          </div>
          <p className="text-gray-600 text-sm mb-3">Login and get JWT token</p>
          <p className="text-gray-500 text-xs mb-2">Request Body:</p>
          <CodeBlock>{`{
  "email": "john@example.com",
  "password": "securepass123"
}`}</CodeBlock>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">GET</span>
            <code className="text-sm font-mono">/auth/me</code>
            <span className="text-xs text-gray-500">(Auth Required)</span>
          </div>
          <p className="text-gray-600 text-sm">Get current user info</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-8">Media Endpoints</h3>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">POST</span>
            <code className="text-sm font-mono">/media/upload</code>
            <span className="text-xs text-gray-500">(Auth Required)</span>
          </div>
          <p className="text-gray-600 text-sm mb-3">Upload a file (multipart/form-data)</p>
          <p className="text-gray-500 text-xs mb-2">Form Fields:</p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li><code className="bg-gray-100 px-1 rounded">file</code> - The media file (required)</li>
            <li><code className="bg-gray-100 px-1 rounded">access</code> - "public" or "private" (optional, default: "public")</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">GET</span>
            <code className="text-sm font-mono">/media</code>
            <span className="text-xs text-gray-500">(Auth Required)</span>
          </div>
          <p className="text-gray-600 text-sm mb-3">List user's media with pagination</p>
          <p className="text-gray-500 text-xs mb-2">Query Parameters:</p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li><code className="bg-gray-100 px-1 rounded">page</code> - Page number (default: 1)</li>
            <li><code className="bg-gray-100 px-1 rounded">limit</code> - Items per page (default: 20)</li>
            <li><code className="bg-gray-100 px-1 rounded">type</code> - Filter by "image" or "video"</li>
            <li><code className="bg-gray-100 px-1 rounded">access</code> - Filter by "public" or "private"</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">GET</span>
            <code className="text-sm font-mono">/media/:id</code>
            <span className="text-xs text-gray-500">(Auth Required)</span>
          </div>
          <p className="text-gray-600 text-sm">Get single media details</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">DELETE</span>
            <code className="text-sm font-mono">/media/:id</code>
            <span className="text-xs text-gray-500">(Auth Required)</span>
          </div>
          <p className="text-gray-600 text-sm">Delete media and all variants</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">PUT</span>
            <code className="text-sm font-mono">/media/:id</code>
            <span className="text-xs text-gray-500">(Auth Required)</span>
          </div>
          <p className="text-gray-600 text-sm mb-3">Update media metadata</p>
          <p className="text-gray-500 text-xs mb-2">Request Body:</p>
          <CodeBlock>{`{
  "access": "private",
  "originalName": "new-filename.jpg"
}`}</CodeBlock>
        </div>
      </div>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div>
      <SectionTitle>Architecture</SectionTitle>
      <SectionParagraph>
        MediaHub follows a clean, modular architecture with clear separation of concerns. The application is structured as a monorepo with separate frontend and backend packages.
      </SectionParagraph>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Directory Structure</h3>
      <CodeBlock>{`├── frontend/                 # React application
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # React context (Auth, Toast)
│       ├── pages/            # Route pages
│       └── services/        # API client
│
├── backend/                  # Express API
│   └── src/
│       ├── controllers/       # Request handlers
│       ├── middleware/       # Auth, upload middleware
│       ├── models/           # Mongoose schemas
│       ├── routes/           # API routes
│       └── services/         # Business logic
│           └── storage/      # Storage adapters
`}</CodeBlock>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Storage Abstraction Layer</h3>
      <SectionParagraph>
        The storage system uses the Adapter Pattern, allowing easy swapping between different storage backends without changing core code.
      </SectionParagraph>
      
      <div className="bg-gray-50 rounded-lg p-4 my-4">
        <p className="font-medium text-gray-800 mb-2">Interface Methods:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><code className="bg-white px-1 rounded">upload(file, options)</code> - Store a file</li>
          <li><code className="bg-white px-1 rounded">delete(path)</code> - Remove a file</li>
          <li><code className="bg-white px-1 rounded">getUrl(path)</code> - Get public URL</li>
          <li><code className="bg-white px-1 rounded">serve(path, res)</code> - Stream file to response</li>
        </ul>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Current Adapters</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800">LocalAdapter</h4>
          <p className="text-sm text-gray-600 mt-1">Stores files on local filesystem</p>
          <p className="text-xs text-gray-500 mt-2">Status: Active</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800">S3Adapter</h4>
          <p className="text-sm text-gray-600 mt-1">AWS S3 cloud storage</p>
          <p className="text-xs text-gray-500 mt-2">Status: Planned</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Data Flow</h3>
      <ol className="list-decimal list-inside text-gray-600 space-y-2">
        <li>Client uploads file via drag & drop or file picker</li>
        <li>Frontend sends multipart/form-data to API</li>
        <li>Multer middleware handles file parsing</li>
        <li>Sharp processes images (thumbnails, variants)</li>
        <li>Storage adapter saves files to chosen backend</li>
        <li>Media record created in MongoDB</li>
        <li>Response returned with file URLs and metadata</li>
      </ol>
    </div>
  );
}

function MediaProcessingSection() {
  return (
    <div>
      <SectionTitle>Media Processing</SectionTitle>
      <SectionParagraph>
        When an image is uploaded, it goes through an automated processing pipeline that creates optimized versions for different use cases.
      </SectionParagraph>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Image Processing Pipeline</h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
          <div>
            <h4 className="font-semibold text-gray-800">Original Upload</h4>
            <p className="text-sm text-gray-600">Original file is stored in /uploads/images/ or /uploads/videos/</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
          <div>
            <h4 className="font-semibold text-gray-800">Metadata Extraction</h4>
            <p className="text-sm text-gray-600">Sharp extracts dimensions, format, and other metadata</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
          <div>
            <h4 className="font-semibold text-gray-800">Thumbnail Generation</h4>
            <p className="text-sm text-gray-600">200x200px cover-crop WebP thumbnail for gallery display</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">4</div>
          <div>
            <h4 className="font-semibold text-gray-800">Responsive Variants</h4>
            <p className="text-sm text-gray-600">If image is larger than threshold:</p>
            <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc list-inside">
              <li>Small: 480px width</li>
              <li>Medium: 800px width</li>
              <li>Large: 1200px width</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">5</div>
          <div>
            <h4 className="font-semibold text-gray-800">WebP Conversion</h4>
            <p className="text-sm text-gray-600">All variants are converted to WebP format for better compression</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Supported Formats</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Input - Images</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• JPEG / JPG</li>
            <li>• PNG</li>
            <li>• GIF</li>
            <li>• WebP</li>
            <li>• SVG</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Input - Videos</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• MP4</li>
            <li>• WebM</li>
            <li>• MOV</li>
            <li>• AVI</li>
          </ul>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Output Formats</h3>
      <p className="text-gray-600">All optimized images are output as <strong>WebP</strong> for maximum compression and browser compatibility.</p>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 font-medium">Note on Videos:</p>
        <p className="text-blue-700 mt-1">
          Video processing is handled differently - original files are stored as-is. Thumbnail generation for videos is a planned feature.
        </p>
      </div>
    </div>
  );
}
