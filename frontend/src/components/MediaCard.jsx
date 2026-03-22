import { useState } from 'react';
import { mediaService } from '../services/api';
import { useToast } from '../context/ToastContext';

const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://localhost:5000';

export default function MediaCard({ media, onDelete, onClick }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [changingAccess, setChangingAccess] = useState(false);

  const thumbnailUrl = media.thumbnail?.url 
    ? `${MEDIA_URL}${media.thumbnail.url}`
    : `${MEDIA_URL}${media.url}`;

  const handleDelete = async (e) => {
    e.stopPropagation();

    setDeleting(true);
    try {
      await mediaService.delete(media._id);
      toast.success(`"${media.originalName}" deleted`);
      if (onDelete) onDelete(media._id);
    } catch (err) {
      toast.error('Failed to delete media');
    } finally {
      setDeleting(false);
    }
  };

  const toggleAccess = async (e) => {
    e.stopPropagation();
    setChangingAccess(true);
    try {
      const newAccess = media.access === 'public' ? 'private' : 'public';
      await mediaService.update(media._id, { access: newAccess });
      toast.success(`File is now ${newAccess}`);
      if (onDelete) onDelete(media._id, true);
    } catch (err) {
      toast.error('Failed to update access');
    } finally {
      setChangingAccess(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div 
      className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1 ${deleting ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => onClick?.(media)}
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img 
          src={thumbnailUrl} 
          alt={media.originalName} 
          loading="lazy"
          className="w-full h-full object-cover"
        />
        
        {media.mediaType === 'video' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 rounded-full flex items-center justify-center z-10">
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="font-medium truncate mb-2" title={media.originalName}>
          {media.originalName}
        </p>
        
        <div className="flex gap-2 text-xs text-gray-500 mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded capitalize">{media.mediaType}</span>
          <span className="px-2 py-1">{formatSize(media.size)}</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={toggleAccess}
            disabled={changingAccess}
            title={media.access === 'public' ? 'Make private' : 'Make public'}
            className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
              media.access === 'public' 
                ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100' 
                : 'border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
            }`}
          >
            {changingAccess ? '...' : media.access === 'public' ? '🌐' : '🔒'}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            className="flex-1 py-2 px-3 border border-red-200 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            {deleting ? '...' : '🗑️'}
          </button>
        </div>
      </div>
    </div>
  );
}
