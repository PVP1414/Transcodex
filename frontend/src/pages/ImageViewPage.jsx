import { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function parseImageSrc(src) {
  const u = new URL(src);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const pathName = u.pathname.split('/').filter(Boolean).pop() || 'Image';
  let title = pathName;
  try {
    title = decodeURIComponent(pathName);
  } catch {
    /* keep pathName */
  }
  return { url: src, title };
}

export default function ImageViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const src = searchParams.get('src');

  const parsed = useMemo(() => {
    if (!src) return null;
    try {
      return parseImageSrc(src);
    } catch {
      return null;
    }
  }, [src]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (window.history.length > 1) navigate(-1);
        else navigate('/');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const handleClose = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  if (!parsed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-900 text-white p-6">
        <p className="text-center text-gray-300">
          Missing or invalid image URL. Use an absolute http(s) link in the <code className="text-indigo-300">src</code> query parameter.
        </p>
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

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <div className="flex-1 flex items-center justify-center min-h-0 p-4 sm:p-8 relative">
        <button
          type="button"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <img
          src={parsed.url}
          alt={parsed.title}
          className="max-w-full max-h-[min(70vh,100%)] object-contain"
        />
      </div>

      <div className="bg-white p-6 border-t border-gray-200 shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold mb-3 break-all text-gray-900">{parsed.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
            <span className="bg-gray-100 px-3 py-1 rounded">Image</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={parsed.url}
              download={parsed.title}
              className="inline-block px-6 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
