import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mediaService } from '../services/api';

async function downloadBlobFromUrl(url, filename) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

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
  const id = searchParams.get('id');
  const src = searchParams.get('src');

  const [info, setInfo] = useState(null);
  const [infoError, setInfoError] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await mediaService.getInfo(id);
        if (!cancelled) {
          setInfo(res.data.data);
          setInfoError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setInfoError(e.response?.data?.message || e.message || 'Failed to load media');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const imgSrcById = id && info ? mediaService.serve(id, { token: token || undefined }) : null;
  const downloadHrefById =
    id && info ? mediaService.serve(id, { download: true, token: token || undefined }) : null;

  const parsed = useMemo(() => {
    if (id) return null;
    if (!src) return null;
    try {
      return parseImageSrc(src);
    } catch {
      return null;
    }
  }, [id, src]);

  const handleBlobDownload = useCallback(async () => {
    if (!parsed) return;
    try {
      await downloadBlobFromUrl(parsed.url, parsed.title);
    } catch {
      window.open(parsed.url, '_blank', 'noopener,noreferrer');
    }
  }, [parsed]);

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

  if (id) {
    if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black text-white p-6">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300">Loading…</p>
        </div>
      );
    }
    if (infoError || !info) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-900 text-white p-6">
          <p className="text-center text-gray-300">{infoError || 'Media not found'}</p>
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
    if (info.mediaType !== 'image') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-900 text-white p-6">
          <p className="text-center text-gray-300">This link is not an image.</p>
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
            src={imgSrcById}
            alt={info.originalName}
            className="max-w-full max-h-[min(70vh,100%)] object-contain"
          />
        </div>

        <div className="bg-white p-6 border-t border-gray-200 shrink-0">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-lg font-semibold mb-3 break-all text-gray-900">{info.originalName}</h1>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
              <span className="bg-gray-100 px-3 py-1 rounded">Image</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={downloadHrefById}
                target="_blank"
                rel="noreferrer"
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

  if (!parsed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-900 text-white p-6">
        <p className="text-center text-gray-300">
          Missing or invalid image URL. Use <code className="text-indigo-300">?id=…</code> for library images or an
          absolute http(s) link in the <code className="text-indigo-300">src</code> query parameter.
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
        <img src={parsed.url} alt={parsed.title} className="max-w-full max-h-[min(70vh,100%)] object-contain" />
      </div>

      <div className="bg-white p-6 border-t border-gray-200 shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold mb-3 break-all text-gray-900">{parsed.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
            <span className="bg-gray-100 px-3 py-1 rounded">Image</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleBlobDownload}
              className="inline-block px-6 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
