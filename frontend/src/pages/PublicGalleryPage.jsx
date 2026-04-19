import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mediaService } from '../services/api';
import { useAuth } from '../context/auth';
import Layout from '../components/Layout';
import { getSharePath } from '../utils/share';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function EmptyState({ user }) {
  return (
    <div className="text-center py-16 bg-gray-50 rounded-xl">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-xl text-gray-600 mb-2">No public media yet</p>
      <p className="text-gray-400">Be the first to share some media!</p>
      {user ? (
        <Link
          to="/upload"
          className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Upload Media
        </Link>
      ) : (
        <Link
          to="/login"
          className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Login to Upload
        </Link>
      )}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="aspect-4/3 animate-pulse bg-gray-200" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaTile({ item, navigate }) {
  const hasThumb = item.mediaType === 'image' || Boolean(item.thumbnail?.path);
  const imgSrc =
    item.mediaType === 'video'
      ? `${API_URL}/streaming/${item._id}/thumbnail`
      : mediaService.serve(String(item._id), {
          thumbnail: Boolean(item.thumbnail?.path),
          variant: item.thumbnail?.path ? undefined : 'small',
        });

  return (
    <button
      type="button"
      onClick={() => navigate(getSharePath(item._id))}
      className="group overflow-hidden rounded-xl bg-white text-left shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {hasThumb ? (
          <img
            src={imgSrc}
            alt={item.originalName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        <div className="absolute right-2 bottom-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-semibold backdrop-blur-sm shadow-sm z-10 flex items-center gap-1">
          {item.mediaType === 'video' ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-3 h-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
          {item.mediaType === 'video' ? 'Video' : 'Image'}
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center z-20">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2">
            <p className="text-sm font-medium truncate" title={item.originalName}>{item.originalName}</p>
            <p className="text-xs opacity-75">{(item.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col grow">
        <div className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1" title={item.originalName}>
          {item.originalName}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto pt-2">
          <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
          <span className="capitalize">
            Public
          </span>
        </div>
      </div>
    </button>
  );
}

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

  const galleryContent = (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Public Media Gallery</h2>
        <p className="text-gray-500 mt-1">
          Browse publicly shared media from all users
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex gap-4 mb-6 items-center">
          <select
            value={filter.type}
            onChange={(e) => setFilter((current) => ({ ...current, type: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <span className="ml-auto text-gray-500 text-sm">
            {pagination.total} items
          </span>
        </div>

        {loading && media.length === 0 ? (
          <GallerySkeleton />
        ) : media.length === 0 ? (
          <EmptyState user={user} />
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {media.map((item) => (
                <MediaTile key={item._id} item={item} navigate={navigate} />
              ))}
            </section>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
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
      </div>
    </>
  );

  if (user) {
    return (
      <Layout>
        {galleryContent}
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <div className="font-bold text-gray-800">MediaHub</div>
              <div className="text-sm text-gray-600">Public Gallery</div>
            </div>
          </div>

          <Link
            to="/login"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {galleryContent}
      </main>
    </div>
  );
}
