import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';

function buildMediaFromSrc(src) {
  const u = new URL(src);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const pathName = u.pathname.split('/').filter(Boolean).pop() || 'Video';
  let originalName = pathName;
  try {
    originalName = decodeURIComponent(pathName);
  } catch {
    /* keep pathName */
  }
  return {
    _id: 'direct-playback',
    url: src,
    originalName,
    size: 0,
    access: 'public',
    mediaType: 'video',
  };
}

export default function WatchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const src = searchParams.get('src');

  const media = useMemo(() => {
    if (!src) return null;
    try {
      return buildMediaFromSrc(src);
    } catch {
      return null;
    }
  }, [src]);

  const handleClose = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  if (!media) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-900 text-white p-6">
        <p className="text-center text-gray-300">Missing or invalid video URL. Use an absolute http(s) link in the <code className="text-indigo-300">src</code> query parameter.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium"
        >
          Go home
        </button>
      </div>
    );
  }

  return <VideoPlayer key={src} media={media} onClose={handleClose} directPlayback />;
}
