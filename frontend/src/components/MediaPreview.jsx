import { useEffect } from 'react';

const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://localhost:5000';

export default function MediaPreview({ media, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const mediaUrl = media.url.startsWith('http') 
    ? media.url 
    : `${MEDIA_URL}${media.url}`;

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDimensions = () => {
    if (media.mediaType === 'video' && media.duration) {
      const mins = Math.floor(media.duration / 60);
      const secs = Math.floor(media.duration % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    if (media.dimensions) {
      return `${media.dimensions.width} × ${media.dimensions.height}`;
    }
    return 'N/A';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 z-10"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex-1 bg-black flex items-center justify-center min-h-0">
          {media.mediaType === 'image' ? (
            <img src={mediaUrl} alt={media.originalName} className="max-w-full max-h-[70vh] object-contain" />
          ) : (
            <video controls autoPlay className="max-w-full max-h-[70vh]">
              <source src={mediaUrl} type={media.mimeType} />
              Your browser does not support video playback.
            </video>
          )}
        </div>

        <div className="p-6 border-t">
          <h3 className="text-lg font-semibold mb-3 break-all">{media.originalName}</h3>
          
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
            <span className="bg-gray-100 px-3 py-1 rounded capitalize">{media.mediaType}</span>
            <span className="bg-gray-100 px-3 py-1 rounded">{formatSize(media.size)}</span>
            <span className="bg-gray-100 px-3 py-1 rounded">{formatDimensions()}</span>
            <span className={`px-3 py-1 rounded ${media.access === 'public' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {media.access === 'public' ? '🌐 Public' : '🔒 Private'}
            </span>
          </div>
          
          <a 
            href={mediaUrl} 
            download={media.originalName}
            className="inline-block px-6 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
