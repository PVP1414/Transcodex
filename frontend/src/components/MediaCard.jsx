import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mediaService } from "../services/api";
import { useToast } from "../context/ToastContext";

const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || "http://localhost:5000";

export default function MediaCard({ media, onDelete }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [changingAccess, setChangingAccess] = useState(false);
  const isVideo = media.mediaType === "video";
  const isImage = media.mediaType === "image";

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
    } catch {
      toast.error("Failed to delete media");
    } finally {
      setDeleting(false);
    }
  };

  const toggleAccess = async (e) => {
    e.stopPropagation();
    setChangingAccess(true);
    try {
      const newAccess = media.access === "public" ? "private" : "public";
      await mediaService.update(media._id, { access: newAccess });
      toast.success(`File is now ${newAccess}`);
      if (onDelete) onDelete(media._id, true);
    } catch {
      toast.error("Failed to update access");
    } finally {
      setChangingAccess(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col ${deleting ? "opacity-50 pointer-events-none" : ""}`}
      onClick={() => navigate(`/resource?id=${media._id}`)}
    >
      <div className="relative aspect-video bg-gray-900 overflow-hidden group-hover:rounded-none transition-all">
        <img
          src={thumbnailUrl}
          alt={media.originalName}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {(isVideo || isImage) && (
          <div className="absolute right-2 bottom-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-semibold backdrop-blur-sm shadow-sm z-10 flex items-center gap-1">
            {isVideo ? (
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
            {isVideo ? "Video" : "Image"}
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full grid place-items-center text-white hover:scale-110 transition-transform">
            {isVideo ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col grow">
        <h3
          className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1"
          title={media.originalName}
        >
          {media.originalName}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 mt-auto pt-2">
          <span>{formatSize(media.size)}</span>
          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
          <span className="capitalize">{media.access}</span>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleAccess}
            disabled={changingAccess}
            title={media.access === "public" ? "Make private" : "Make public"}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium border flex justify-center items-center gap-1 transition-colors ${
              media.access === "public"
                ? "border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                : "border-yellow-100 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
            }`}
          >
            {changingAccess ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : media.access === "public" ? (
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            )}
            {media.access === "public" ? "Public" : "Private"}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            className="flex-none w-8 py-1.5 rounded-md border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 justify-center items-center flex transition-colors"
          >
            {deleting ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
