import { useState, useEffect, useCallback } from "react";
import { mediaService } from "../services/api";
import MediaCard from "./MediaCard";
import { MediaGallerySkeleton } from "./Skeleton";

export default function MediaGallery({ refreshTrigger }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState({ type: "", access: "" });

  const fetchMedia = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter.type) params.type = filter.type;
      if (filter.access) params.access = filter.access;

      const res = await mediaService.list(params);
      setMedia(res.data.data.media);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  }, [filter.access, filter.type]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia, refreshTrigger]);

  const handleDelete = (id, updated = false) => {
    if (updated) {
      fetchMedia(pagination.page);
    } else {
      setMedia((prev) => prev.filter((m) => m._id !== id));
    }
  };

  const handlePageChange = (newPage) => {
    fetchMedia(newPage);
  };

  if (loading && media.length === 0) {
    return <MediaGallerySkeleton count={8} />;
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-6 items-center">
        <select
          value={filter.type}
          onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>

        <select
          value={filter.access}
          onChange={(e) => setFilter((f) => ({ ...f, access: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Access</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <span className="ml-auto text-gray-500 text-sm">
          {pagination.total} items
        </span>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xl text-gray-600 mb-2">No media found</p>
          <p className="text-gray-400">
            Upload your first file to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {media.map((item) => (
              <MediaCard key={item._id} media={item} onDelete={handleDelete} />
            ))}
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
  );
}
