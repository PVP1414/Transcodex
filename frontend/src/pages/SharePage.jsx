import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImagePlayer from "../components/ImagePlayer";
import VideoPlayer from "../components/VideoPlayer";
import { publicApi } from "../services/api";

function ShareErrorState({ title, message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-6 py-12">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white shadow-2xl">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-white/70">{message}</p>
      </div>
    </div>
  );
}

export default function SharePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMedia() {
      setLoading(true);
      try {
        const res = await publicApi.get(`/media/${id}/info`);
        if (!cancelled) {
          setMedia(res.data.data);
          setErrorState(null);
        }
      } catch (err) {
        if (cancelled) return;

        const status = err.response?.status;
        if (status === 403) {
          setErrorState({
            title: "Not Publicly Shared",
            message: "This media is private or no longer available for public sharing.",
          });
        } else if (status === 404) {
          setErrorState({
            title: "Media Not Found",
            message: "This share link does not point to an available media resource.",
          });
        } else {
          setErrorState({
            title: "Unable to Load Media",
            message: "There was a problem loading this shared media.",
          });
        }
        setMedia(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadMedia();
    } else {
      setLoading(false);
      setErrorState({
        title: "Invalid Share Link",
        message: "This share link is missing a media identifier.",
      });
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/public-gallery");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-950 text-white p-6">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/70">Loading shared media…</p>
      </div>
    );
  }

  if (errorState || !media) {
    return (
      <ShareErrorState
        title={errorState?.title || "Unable to Load Media"}
        message={errorState?.message || "This shared media could not be loaded."}
      />
    );
  }

  if (media.mediaType === "video") {
    return <VideoPlayer media={media} onClose={handleClose} publicView />;
  }

  return <ImagePlayer media={media} onClose={handleClose} publicView />;
}
