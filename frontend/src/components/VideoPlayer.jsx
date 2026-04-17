import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://localhost:5000';

export default function VideoPlayer({ media, onClose }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const token = localStorage.getItem('token');
  const toast = useToast();
  
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamStatus, setStreamStatus] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const fallbackUrl = media.url.startsWith('http') ? media.url : `${MEDIA_URL}${media.url}`;
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchStreamStatus = async () => {
      try {
        const res = await api.get(`/streaming/${media._id}/status`);
        const data = res.data;
        if (data.success && data.data) {
          setStreamStatus(data.data);
          if (data.data.qualities) {
            setQualities(data.data.qualities); // This is an array of strings like ["360p", "480p"]
          }
        }
      } catch (err) {
        console.error('Failed to fetch stream status:', err);
      }
    };
    fetchStreamStatus();
  }, [media._id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    const hlsUrl = `${API_URL}/streaming/${media._id}/master.m3u8${token ? `?token=${token}` : ''}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: (xhr, url) => {
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        }
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        // Autoplay policy might block this, so we catch
        video.play().catch(() => setIsPlaying(false));
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
        video.play().catch(() => setIsPlaying(false));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [media._id, token]);

  // Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setLoading(true);
    const handlePlaying = () => setLoading(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowright':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime += 5;
          break;
        case 'arrowleft':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime -= 5;
          break;
        case 'arrowup':
          e.preventDefault();
          if (videoRef.current) videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          if (videoRef.current) videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
          break;
        case 'escape':
          if (!isFullscreen) onClose();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Hide controls logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const handleSeek = (e) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleQualityChange = (level) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setShowSettings(false);
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-0 sm:p-8" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      
      {/* Video Overlay wrapper */}
      <div className={`relative bg-black w-full max-w-6xl mx-auto flex flex-col ${isFullscreen ? 'h-full max-w-none' : 'rounded-xl overflow-hidden shadow-2xl max-h-[100dvh] sm:max-h-[90vh]'}`}>
        
        {/* Close Button (only show if not fullscreen and we have controls visible) */}
        {!isFullscreen && (
          <button 
            className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Video Player Area */}
        <div 
          ref={containerRef}
          className="relative group w-full flex-1 flex-shrink min-h-0 flex items-center justify-center bg-black overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            poster={streamStatus?.hasHls ? `${API_URL}/streaming/${media._id}/thumbnail` : undefined}
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            src={useFallback ? fallbackUrl : undefined}
            playsInline
          />

          {/* YouTube-like Settings Menu Overlay */}
          {showSettings && (
            <div className="absolute bottom-16 right-4 sm:right-6 bg-black/90 text-white rounded-lg p-2 w-48 shadow-lg z-20 text-sm border border-white/10 backdrop-blur-md">
              <div className="px-3 py-2 font-semibold border-b border-white/10 flex justify-between items-center text-gray-200">
                Quality
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="py-1 max-h-48 overflow-y-auto">
                <button 
                  onClick={() => handleQualityChange(-1)} 
                  className={`w-full text-left px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-2 ${currentQuality === -1 ? 'text-indigo-400' : ''}`}
                >
                  {currentQuality === -1 && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                  <span className={currentQuality === -1 ? 'pl-0' : 'pl-4'}>Auto</span>
                </button>
                {qualities.map((q, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleQualityChange(idx)} 
                    className={`w-full text-left px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-2 ${currentQuality === idx ? 'text-indigo-400' : ''}`}
                  >
                    {currentQuality === idx && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                    <span className={currentQuality === idx ? 'pl-0' : 'pl-4'}>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Controls Bar */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col pt-12 pb-2 px-4 transition-opacity duration-300 z-10 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Timeline Slider */}
            <div className="w-full relative h-1 sm:h-1.5 bg-gray-600/50 rounded-full mb-3 group/slider cursor-pointer">
              {/* Progress fill */}
              <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full group-hover/slider:bg-indigo-400 transition-colors" style={{ width: `${progress}%` }}></div>
              {/* Thumb */}
              <div className="absolute top-1/2 -mt-1.5 sm:-mt-2 w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity shadow" style={{ left: `calc(${progress}% - 8px)` }}></div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress || 0} 
                onChange={handleSeek} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none" 
              />
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between text-white">
              
              <div className="flex items-center gap-3 sm:gap-6">
                <button onClick={togglePlay} className="hover:text-indigo-400 transition-colors focus:outline-none">
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                
                {/* Volume Control */}
                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="hover:text-indigo-400 transition-colors focus:outline-none">
                    {isMuted || volume === 0 ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                    ) : volume < 0.5 ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    )}
                  </button>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" 
                    value={isMuted ? 0 : volume} 
                    onChange={handleVolumeChange} 
                    className="w-0 overflow-hidden group-hover/volume:w-16 sm:group-hover/volume:w-20 transition-all duration-300 h-1 bg-gray-500 rounded-full appearance-none outline-none cursor-pointer"
                    style={{ WebkitAppearance: 'none', background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${isMuted ? 0 : volume * 100}%, #4b5563 ${isMuted ? 0 : volume * 100}%, #4b5563 100%)` }}
                  />
                </div>

                <div className="text-xs sm:text-sm font-medium text-gray-200 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {/* Quality Settings */}
                {!useFallback && qualities.length > 0 && (
                  <button 
                    onClick={() => setShowSettings(!showSettings)} 
                    className={`hover:text-indigo-400 transition-colors focus:outline-none flex items-center gap-1 ${showSettings ? 'text-indigo-400' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    <span className="text-xs hidden sm:inline-block border border-gray-500 rounded px-1 min-w-[32px] text-center">
                      {currentQuality === -1 ? 'Auto' : qualities[currentQuality]}
                    </span>
                  </button>
                )}

                {/* Fullscreen Toggle */}
                <button onClick={toggleFullscreen} className="hover:text-indigo-400 transition-colors focus:outline-none">
                  {isFullscreen ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Metadata Panel below the video */}
        {!isFullscreen && (
          <div className="bg-white p-4 sm:p-6 text-gray-800 shrink-0">
            <h3 className="text-lg sm:text-xl font-bold mb-3 break-all flex items-center justify-between">
              {media.originalName}
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(fallbackUrl);
                      toast.success('Public link copied to clipboard!');
                    } catch (err) {
                      toast.error('Failed to copy link');
                    }
                  }}
                  className="p-2 sm:px-4 sm:py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-100 transition-colors text-sm flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  <span className="hidden sm:inline">Share</span>
                </button>
                <a 
                  href={media.url}
                  download={media.originalName}
                  className="p-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </h3>

            {streamStatus && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">Quality Processing:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    streamStatus.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    streamStatus.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                    streamStatus.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {streamStatus.status} {streamStatus.progress > 0 && streamStatus.progress < 100 ? `${streamStatus.progress}%` : ''}
                  </span>
                </div>
                {streamStatus.qualities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {streamStatus.qualities.map((q, idx) => (
                      <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {q}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-gray-600 font-medium items-center">
              <span className="bg-gray-100 px-3 py-1.5 rounded-md flex items-center justify-center min-w-[4rem]">Video</span>
              <span className="bg-gray-100 px-3 py-1.5 rounded-md flex items-center justify-center min-w-[5rem]">{formatSize(media.size)}</span>
              <span className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${media.access === 'public' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                {media.access === 'public' ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Public</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Private</>

                )}
              </span>
              {useFallback && (
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  Direct MP4 Playback
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}