import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { mediaService } from "../services/api";
import VideoPlayer from "../components/VideoPlayer";
import ImagePlayer from "../components/ImagePlayer";

export default function ResourcePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");

  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch media info on mount
  useEffect(() => {
    if (!id) {
      setError("No media ID provided");
      setLoading(false);
      return;
    }

    const fetchMedia = async () => {
      setLoading(true);
      try {
        const res = await mediaService.getInfo(id);
        setMedia(res.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load media");
        setMedia(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [id]);

  const goBackToGallery = () => {
    navigate("/gallery");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <svg
            className="w-8 h-8 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !media) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Load Media
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The media could not be found or accessed."}
          </p>
          <button
            onClick={goBackToGallery}
            className="inline-block px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Video display
  if (media.mediaType === "video") {
    return <VideoPlayer media={media} onClose={goBackToGallery} />;
  }

  // Image display
  return <ImagePlayer media={media} onClose={goBackToGallery} />;
}
