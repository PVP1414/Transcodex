import { useState } from 'react';
import Layout from '../components/Layout';
import Upload from '../components/Upload';
import { useToast } from '../context/ToastContext';
import { mediaService } from '../services/api';

export default function UploadPage() {
  const toast = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = (media) => {
    setRefreshTrigger(n => n + 1);
    toast.success(`"${media.originalName}" uploaded successfully!`);
  };

  return (
    <Layout title="Upload">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Upload Media</h2>
          <p className="text-gray-500 mt-1">
            Drag and drop your images or videos, or click to browse
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-100">
          <Upload onUploadComplete={handleUploadComplete} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">Images</h4>
            <p className="text-sm text-gray-600">JPEG, PNG, GIF, WebP, SVG</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">Videos</h4>
            <p className="text-sm text-gray-600">MP4, WebM, MOV, AVI</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">Secure</h4>
            <p className="text-sm text-gray-600">Files up to 50MB</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
