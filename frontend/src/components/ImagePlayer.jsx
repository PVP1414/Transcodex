import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mediaService } from "../services/api";
import { getSharePath } from "../utils/share";

export default function ImagePlayer({ media, onClose, publicView = false }) {
  const navigate = useNavigate();
  const [currentQuality, setCurrentQuality] = useState("original");
  const token = publicView ? null : localStorage.getItem("token");
  const canShare = !publicView && media?.access === "public";

  const mediaUrl = useMemo(() => {
    if (!media) return "";
    return mediaService.serve(String(media._id), {
      variant: currentQuality === "original" ? undefined : currentQuality,
      token: token || undefined,
    });
  }, [currentQuality, media, token]);

  useEffect(() => {
    const onKeyDown = (evt) => {
      if (evt.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
                href={mediaService.serve(String(media._id), {
                  download: true,
                  token: token || undefined,
                })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                Download
              </a>
              {canShare ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(getSharePath(media._id));
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Share Link
                </button>
              ) : !publicView ? (
                <span className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/50">
                  Make public to share
                </span>
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
