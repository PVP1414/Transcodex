import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://localhost:5000';

export default function VideoPlayer({ media, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const { token } = useAuth();
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamStatus, setStreamStatus] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  const fallbackUrl = media.url.startsWith('http') ? media.url : `${MEDIA_URL}${media.url}`;

  useEffect(() => {
    const fetchStreamStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/streaming/${media._id}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStreamStatus(data.data);
        if (data.data.qualities) {
          setQualities(data.data.qualities);
        }
      } catch (err) {
        console.error('Failed to fetch stream status:', err);
      }
    };
    fetchStreamStatus();
  }, [media._id, token]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    const hlsUrl = `${API_URL}/streaming/${media._id}/master.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('[HLS] Fatal error, switching to fallback:', data);
          setUseFallback(true);
          setLoading(false);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [media._id, token]);

  const handleQualityChange = (level) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getQualityLabel = (level) => {
    if (level === -1) return 'Auto';
    const quality = qualities[level];
    return quality ? quality.name : `Level ${level}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <button 
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 z-10"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="relative bg-black flex items-center justify-center">
          {useFallback ? (
            <video
              ref={videoRef}
              controls
              autoPlay
              className="max-w-full max-h-[70vh]"
              src={fallbackUrl}
            />
          ) : (
            <video
              ref={videoRef}
              controls
              className="max-w-full max-h-[70vh]"
              poster={streamStatus?.hasHls ? `${API_URL}/streaming/${media._id}/thumbnail` : undefined}
            />
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-red-400 text-center">
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold break-all">{media.originalName}</h3>
            
            {!useFallback && qualities.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Quality:</span>
                <select
                  value={currentQuality}
                  onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                  className="bg-gray-100 px-3 py-1 rounded text-sm border-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={-1}>Auto</option>
                  {qualities.map((q, idx) => (
                    <option key={idx} value={idx}>{q.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {streamStatus && (
            <div className="mb-4">
              {useFallback && (
                <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  HLS unavailable - playing direct video
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Transcoding Status:</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  streamStatus.status === 'completed' ? 'bg-green-100 text-green-700' :
                  streamStatus.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  streamStatus.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {streamStatus.status}
                </span>
                {streamStatus.progress > 0 && streamStatus.progress < 100 && (
                  <span className="text-sm text-gray-500">{streamStatus.progress}%</span>
                )}
              </div>
              {streamStatus.qualities?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {streamStatus.qualities.map((q, idx) => (
                    <span key={idx} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                      {q}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
            <span className="bg-gray-100 px-3 py-1 rounded">Video</span>
            <span className="bg-gray-100 px-3 py-1 rounded">{formatSize(media.size)}</span>
            <span className={`px-3 py-1 rounded ${media.access === 'public' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {media.access === 'public' ? 'Public' : 'Private'}
            </span>
          </div>

          <div className="flex gap-3">
            {streamStatus?.hasHls ? (
              <span className="inline-flex items-center gap-1 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                HLS Streaming
              </span>
            ) : (
              <a 
                href={media.url}
                download={media.originalName}
                className="inline-block px-6 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}