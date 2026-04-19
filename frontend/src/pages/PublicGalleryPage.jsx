import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mediaService } from '../services/api';
import { useAuth } from '../context/auth';
import Layout from '../components/Layout';
import { getSharePath } from '../utils/share';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PublicGalleryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState({ type: '' });

  const fetchMedia = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter.type) params.type = filter.type;
      
      const res = await mediaService.listPublic(params);
      setMedia(res.data.data.media);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  }, [filter.type]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handlePageChange = (newPage) => {
    fetchMedia(newPage);
  };

  const content = (
    <div className={user ? '' : "min-h-screen bg-gray-50"}>
      {!user && (
        <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-gray-800">MediaHub</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-600">Public Gallery</span>
            </div>
            <Link
              to="/login"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </header>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Public Media Gallery</h1>
          <p className="text-gray-500 mt-2">Browse publicly shared media from all users</p>
        </div>

        <div className="flex gap-4 mb-6 items-center">
          <select 
            value={filter.type} 
            onChange={(e) => setFilter(f => ({ ...f, type: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          
          <span className="ml-auto text-gray-500 text-sm">{pagination.total} items</span>
        </div>

        {loading && media.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xl text-gray-600 mb-2">No public media yet</p>
            <p className="text-gray-400">Be the first to share some media!</p>
            {!user ? (
              <Link
                to="/login"
                className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Login to Upload
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upload Media
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {media.map(item => {
                const hasThumb = item.mediaType === 'image' || Boolean(item.thumbnail?.path);
                const imgSrc =
                  item.mediaType === 'video'
                    ? `${API_URL}/streaming/${item._id}/thumbnail`
                    : mediaService.serve(String(item._id), {
                        thumbnail: Boolean(item.thumbnail?.path),
                        variant: item.thumbnail?.path ? undefined : 'small',
                      });

                return (
                <div
                  key={item._id}
                  className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => navigate(getSharePath(item._id))}
                >
                  {hasThumb ? (
                    <img
                      src={imgSrc}
                      alt={item.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {item.mediaType === 'video' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 rounded-full flex items-center justify-center z-10 pointer-events-none">
                      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center z-20">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2">
                      <p className="text-sm font-medium truncate" title={item.originalName}>{item.originalName}</p>
                      <p className="text-xs opacity-75">{(item.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">Page {pagination.page} of {pagination.pages}</span>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );

  return user ? <Layout>{content}</Layout> : content;
}
