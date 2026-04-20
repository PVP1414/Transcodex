import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mediaService } from "../services/api";
import { useToast } from "../context/toast";
import { copyShareUrl, getSharePath } from "../utils/share";

export default function ImagePlayer({ media, onClose, publicView = false, apiKey = null }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentQuality, setCurrentQuality] = useState("original");
  const token = publicView ? null : localStorage.getItem("token");
  const canShare = !publicView && media?.access === "public";

  const mediaUrl = useMemo(() => {
    if (!media) return "";
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const variant = currentQuality === "original" ? undefined : currentQuality;
    const params = new URLSearchParams();
    if (apiKey) {
      params.set("apiKey", apiKey);
    } else if (token) {
      params.set("token", token);
    }
    if (variant) params.set("variant", variant);
    const qs = params.toString();
    return `${apiBaseUrl}/media/${media._id}/serve${qs ? `?${qs}` : ""}`;
  }, [currentQuality, media, token, apiKey]);

  useEffect(() => {
    const onKeyDown = (evt) => {
      if (evt.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleShare = async (event) => {
    event.stopPropagation();
    try {
      await copyShareUrl(media._id);
      toast.success("Public share link copied");
    } catch {
      toast.error("Failed to copy share link");
    }
    navigate(getSharePath(media._id));
  };

  const handleCopyId = async (event) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(media._id);
      toast.success("Media ID copied");
    } catch {
      toast.error("Failed to copy ID");
    }
  };

  if (!media) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div className="text-sm text-white/80">{media.originalName}</div>
        </div>
        <button
          type="button"
          onClick={handleCopyId}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
          title="Copy ID"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy ID
        </button>
        <div className="text-sm text-gray-300">
          <span className="mr-2">{media.mediaType}</span>
          <span>
            {media.size
              ? `${(media.size / (1024 * 1024)).toFixed(1)} MB`
              : "Unknown size"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-6">
        <img
          src={mediaUrl}
          alt={media.originalName}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="bg-black/80 border-t border-white/10 px-4 py-5 sm:px-6 sm:py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="text-white text-lg font-semibold">
                {media.originalName}
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                <span className="rounded-full bg-white/5 px-3 py-1">
                  {media.mediaType}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1">
                  {media.dimensions
                    ? `${media.dimensions.width}×${media.dimensions.height}`
                    : "Unknown dimensions"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 ${media.access === "public" ? "bg-green-600/20 text-green-200" : "bg-yellow-600/20 text-yellow-200"}`}
                >
                  {media.access === "public" ? "Public" : "Private"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/media/${media._id}/serve?download=true${apiKey ? `&apiKey=${apiKey}` : (token ? `&token=${token}` : "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                Download
              </a>
              {canShare ? (
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center rounded-lg bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Share Link
                </button>
              ) : null}
            </div>
          </div>

          {media.variants?.length > 0 && (
            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="text-sm font-semibold text-gray-300 mb-3">
                Quality
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentQuality("original");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${currentQuality === "original" ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-200 hover:bg-white/20"}`}
                >
                  Original
                </button>
                {media.variants.map((variant) => (
                  <button
                    key={variant.name}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentQuality(variant.name);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${currentQuality === variant.name ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-200 hover:bg-white/20"}`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
