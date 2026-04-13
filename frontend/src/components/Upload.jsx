import { useState, useRef } from 'react';
import { mediaService } from '../services/api';

export default function Upload({ onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    setError('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('access', 'private');
    const isVideo = file.type.startsWith('video');

    try {
      const res = await mediaService.upload(formData, (progressEvent) => {
        let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (percentCompleted === 100) percentCompleted = 99;
        setProgress(isVideo ? Math.floor(percentCompleted / 2) : percentCompleted);
      });
      
      const uploadedMedia = res.data.data;
      
      if (isVideo && uploadedMedia.hls?.status === 'processing') {
        const intervalId = setInterval(async () => {
          try {
            const statusRes = await mediaService.getById(uploadedMedia._id);
            const statusMedia = statusRes.data.data;
            if (statusMedia.transcodingProgress > 0) {
              setProgress(50 + Math.floor(statusMedia.transcodingProgress / 2));
            }
            if (statusMedia.hls.status === 'completed' || statusMedia.hls.status === 'failed') {
               clearInterval(intervalId);
               setProgress(100);
               if (onUploadComplete) onUploadComplete(statusMedia);
               setTimeout(() => setUploading(false), 500);
            }
          } catch(err) {
             clearInterval(intervalId);
             setUploading(false);
          }
        }, 1000);
      } else {
        setProgress(100);
        if (onUploadComplete) {
          onUploadComplete(uploadedMedia);
        }
        setTimeout(() => setUploading(false), 500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragOver 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
        } ${uploading ? 'cursor-default border-indigo-500 border-solid' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="none"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-indigo-500"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="none"
                  r="45"
                  cx="50"
                  cy="50"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (283 * progress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-indigo-600">
                {Math.round(progress)}%
              </span>
            </div>
            <p className="mt-4 text-gray-600">
              {progress === 99 ? 'Processing...' : 'Uploading...'}
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 text-indigo-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-lg text-gray-600 mb-2">
              Drag & drop your file here, or <span className="text-indigo-600 font-semibold">browse</span>
            </p>
            <p className="text-sm text-gray-400">Supports images and videos up to 50MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
          {error}
        </div>
      )}
    </div>
  );
}
