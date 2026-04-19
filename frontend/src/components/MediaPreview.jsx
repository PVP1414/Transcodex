import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import { mediaService } from '../services/api';
import { getSharePath } from '../utils/share';

export default function MediaPreview({ media: initialMedia, onClose }) {
  const [media] = useState(initialMedia);
  const [currentQuality, setCurrentQuality] = useState('original');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const canShare = media?.access === 'public';
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

  const getDisplayUrl = () => {
    return mediaService.serve(String(media._id), {
      variant: currentQuality === 'original' ? undefined : currentQuality,
      token: token || undefined,
    });
  };

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

  if (media.mediaType === 'video') {
    return <VideoPlayer media={media} onClose={onClose} />;
  }

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

        <div className="flex-1 bg-black flex items-center justify-center min-h-0 relative">
          <img src={getDisplayUrl()} alt={media.originalName} className="max-w-full max-h-[70vh] object-contain transition-opacity duration-300" />
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

          {media.mediaType === 'image' && media.variants?.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-gray-700">Quality:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCurrentQuality('original')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentQuality === 'original' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Original
                </button>
                {media.variants.map(v => (
                  <button
                    key={v.name}
                    onClick={() => setCurrentQuality(v.name)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${currentQuality === v.name ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <a
              href={mediaService.serve(String(media._id), { download: true, token: token || undefined })}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-6 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Download
            </a>
            {canShare ? (
              <button
                type="button"
                onClick={() => {
                  navigate(getSharePath(media._id));
                }}
                className="inline-block px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                Share link
              </button>
            ) : (
              <span className="inline-block px-6 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg">
                Make public to share
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
