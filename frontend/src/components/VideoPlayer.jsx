import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Hls from "hls.js";
import api, { mediaService } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || "http://localhost:5000";

export default function VideoPlayer({
  media,
  onClose,
  directPlayback = false,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamStatus, setStreamStatus] = useState(null);
  const [useFallback, setUseFallback] = useState(!!directPlayback);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bufferedRanges, setBufferedRanges] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [scrubPreviewTime, setScrubPreviewTime] = useState(0);
  const [scrubTooltipVisible, setScrubTooltipVisible] = useState(false);

  // Guard: ensure media and media.url exist
  if (!media || !media.url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4 p-6">
        <p className="text-center text-gray-300">
          Unable to load video. Media data is incomplete.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const fallbackUrl = media.url.startsWith("http")
    ? media.url
    : `${MEDIA_URL}${media.url}`;

  const isDirectPlaybackLink = String(media._id) === "direct-playback";

  const downloadHref = useMemo(() => {
    if (isDirectPlaybackLink) return fallbackUrl;
    const t = token || undefined;
    return mediaService.serve(String(media._id), { download: true, token: t });
  }, [media._id, fallbackUrl, token, isDirectPlaybackLink]);

  const [directDownloadPending, setDirectDownloadPending] = useState(false);

  const handleDirectPlaybackDownload = useCallback(async () => {
    const name = media.originalName || "video.mp4";
    setDirectDownloadPending(true);
    try {
      const res = await fetch(fallbackUrl, { mode: "cors" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = name;
      a.rel = "noopener";
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDirectDownloadPending(false);
    }
  }, [fallbackUrl, media.originalName]);

  const controlsTimeoutRef = useRef(null);
  const scrubSeekingRef = useRef(false);

  const scrubInfo = useMemo(() => {
    const s = streamStatus?.scrub;
    if (!s?.available) return null;
    return s;
  }, [streamStatus]);

  const scrubImageUrl = useMemo(() => {
    if (!scrubInfo) return null;
    const q = token ? `?token=${token}` : "";
    return `${API_URL}/streaming/${media._id}/scrub.jpg${q}`;
  }, [scrubInfo, media._id, token]);

  useEffect(() => {
    if (!scrubImageUrl) return;
    const img = new Image();
    img.src = scrubImageUrl;
  }, [scrubImageUrl]);

  useEffect(() => {
    const endSeek = () => {
      scrubSeekingRef.current = false;
    };
    window.addEventListener("pointerup", endSeek);
    window.addEventListener("pointercancel", endSeek);
    return () => {
      window.removeEventListener("pointerup", endSeek);
      window.removeEventListener("pointercancel", endSeek);
    };
  }, []);

  useEffect(() => {
    if (directPlayback) return;
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
        console.error("Failed to fetch stream status:", err);
      }
    };
    fetchStreamStatus();
  }, [media._id, directPlayback]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (directPlayback) {
      setLoading(false);
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    const hlsUrl = `${API_URL}/streaming/${media._id}/master.m3u8${token ? `?token=${token}` : ""}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: (xhr, url) => {
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
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
          console.error("[HLS] Fatal error, switching to fallback:", data);
          setUseFallback(true);
          setLoading(false);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [media._id, token, directPlayback]);

  // Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100 || 0);

      const ranges = [];
      if (video.buffered && video.duration > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          const start = (video.buffered.start(i) / video.duration) * 100;
          const end = (video.buffered.end(i) / video.duration) * 100;
          ranges.push({ start, width: end - start });
        }
      }
      setBufferedRanges(ranges);
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

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(() => setIsPlaying(false));
      return;
    }
    video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const isInputFocused = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable ||
        !!target.closest("[contenteditable]:not([contenteditable='false'])")
      );
    };

    const handleKeyDown = (e) => {
      if (isInputFocused(e.target)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const video = videoRef.current;
      if (!video) return;
      const key = e.key.toLowerCase();
      const isToggleKey =
        key === " " || key === "spacebar" || key === "k" || key === "m" || key === "f";
      if (e.repeat && isToggleKey) return;
      const seek = (seconds) => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        video.currentTime = Math.max(
          0,
          Math.min(video.duration, video.currentTime + seconds),
        );
      };
      switch (key) {
        case " ":
        case "spacebar":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "j":
          e.preventDefault();
          seek(-10);
          break;
        case "l":
          e.preventDefault();
          seek(10);
          break;
        case "arrowright":
          e.preventDefault();
          seek(5);
          break;
        case "arrowleft":
          e.preventDefault();
          seek(-5);
          break;
        case "arrowup":
          e.preventDefault();
          if (video) {
            video.volume = Math.min(1, video.volume + 0.05);
            video.muted = video.volume === 0;
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (video) {
            video.volume = Math.max(0, video.volume - 0.05);
            video.muted = video.volume === 0;
          }
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "0":
        case "home":
          e.preventDefault();
          if (video) video.currentTime = 0;
          break;
        case "end":
          e.preventDefault();
          if (Number.isFinite(video.duration) && video.duration > 0) {
            video.currentTime = video.duration;
          }
          break;
        case "escape":
          if (!document.fullscreenElement) onClose?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, toggleFullscreen, toggleMute, togglePlay]);

  // Hide controls logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const handleSeekInput = (e) => {
    const v = parseFloat(e.target.value);
    if (duration > 0) {
      setProgress(v);
      const newTime = (v / 100) * duration;
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
      if (scrubInfo) {
        setScrubPreviewTime(newTime);
        setScrubTooltipVisible(true);
      }
    }
  };

  const handleRangePointerDown = () => {
    scrubSeekingRef.current = true;
    if (scrubInfo && duration > 0) {
      setScrubTooltipVisible(true);
    }
  };

  const handleRangeMouseMove = (e) => {
    if (!scrubInfo || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    setScrubPreviewTime(ratio * duration);
    setScrubTooltipVisible(true);
  };

  const handleRangeMouseLeave = () => {
    if (!scrubSeekingRef.current) {
      setScrubTooltipVisible(false);
    }
  };

  const handleRangeTouchMove = (e) => {
    if (!scrubInfo || duration <= 0) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (touch.clientX - rect.left) / rect.width),
    );
    setScrubPreviewTime(ratio * duration);
    setScrubTooltipVisible(true);
  };

  const scrubCellStyle = useCallback(
    (t) => {
      if (!scrubInfo || !scrubImageUrl || !duration) return {};
      const { cols, rows, frameCount, cellWidth, cellHeight, intervalSec } =
        scrubInfo;
      let idx = Math.floor(t / intervalSec);
      idx = Math.max(0, Math.min(frameCount - 1, idx));
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        width: cellWidth,
        height: cellHeight,
        backgroundImage: `url(${scrubImageUrl})`,
        backgroundSize: `${cols * cellWidth}px ${rows * cellHeight}px`,
        backgroundPosition: `${-col * cellWidth}px ${-row * cellHeight}px`,
      };
    },
    [scrubInfo, scrubImageUrl, duration],
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-0 sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Video Overlay wrapper */}
      <div
        className={`relative bg-black w-full max-w-6xl mx-auto flex flex-col ${isFullscreen ? "h-full max-w-none" : "rounded-xl overflow-hidden shadow-2xl max-h-[100dvh] sm:max-h-[90vh]"}`}
      >
        {/* Top Control Bar */}
        <div className="absolute inset-x-0 top-0 z-20 bg-black/60 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
          <button
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
          <div className="text-sm text-white/80 flex items-center gap-3">
            <span className="font-medium capitalize">{media.mediaType}</span>
            <span>{formatSize(media.size)}</span>
          </div>
        </div>
        {/* Video Player Area */}
        <div
          ref={containerRef}
          className="relative group w-full flex-1 flex-shrink min-h-0 flex items-center justify-center bg-black overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
            poster={
              streamStatus?.hasHls
                ? `${API_URL}/streaming/${media._id}/thumbnail`
                : undefined
            }
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
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="py-1 max-h-48 overflow-y-auto">
                <button
                  onClick={() => handleQualityChange(-1)}
                  className={`w-full text-left px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-2 ${currentQuality === -1 ? "text-blue-400" : ""}`}
                >
                  {currentQuality === -1 && (
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                  <span className={currentQuality === -1 ? "pl-0" : "pl-4"}>
                    Auto
                  </span>
                </button>
                {qualities.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQualityChange(idx)}
                    className={`w-full text-left px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-2 ${currentQuality === idx ? "text-blue-400" : ""}`}
                  >
                    {currentQuality === idx && (
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    )}
                    <span className={currentQuality === idx ? "pl-0" : "pl-4"}>
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Controls Bar */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col pb-2 px-4 transition-opacity duration-300 z-10 ${scrubInfo ? "pt-24 sm:pt-28" : "pt-12"} ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}
          >
            {/* Timeline Slider */}
            <div className="w-full relative mb-3 group/slider cursor-pointer pt-1">
              {scrubInfo && scrubTooltipVisible && duration > 0 && (
                <div
                  className="absolute pointer-events-none z-[4] flex flex-col items-center gap-1"
                  style={{
                    left: `${(scrubPreviewTime / duration) * 100}%`,
                    bottom: "calc(100% + 10px)",
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    className="rounded border border-white/25 shadow-lg overflow-hidden bg-black shrink-0"
                    style={scrubCellStyle(scrubPreviewTime)}
                  />
                  <span className="text-[10px] sm:text-xs text-white tabular-nums bg-black/85 px-1.5 py-0.5 rounded">
                    {formatTime(scrubPreviewTime)}
                  </span>
                </div>
              )}
              <div className="relative h-1 sm:h-1.5 bg-gray-600/50 rounded-full">
                {/* Buffered fill (chunks loaded) */}
                {bufferedRanges.map((range, idx) => (
                  <div
                    key={`buf-${idx}`}
                    className="absolute top-0 h-full bg-gray-400/60 rounded-full transition-all duration-300 pointer-events-none"
                    style={{
                      left: `${range.start}%`,
                      width: `${range.width}%`,
                    }}
                  ></div>
                ))}
                {/* Progress fill */}
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full group-hover/slider:bg-blue-400 transition-colors pointer-events-none"
                  style={{ width: `${progress}%`, zIndex: 1 }}
                ></div>
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -mt-1.5 sm:-mt-2 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity shadow pointer-events-none"
                  style={{ left: `calc(${progress}% - 8px)`, zIndex: 2 }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress || 0}
                  onInput={handleSeekInput}
                  onChange={handleSeekInput}
                  onPointerDown={handleRangePointerDown}
                  onMouseMove={handleRangeMouseMove}
                  onMouseLeave={handleRangeMouseLeave}
                  onTouchMove={handleRangeTouchMove}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none"
                  style={{ zIndex: 3 }}
                />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3 sm:gap-6">
                <button
                  onClick={togglePlay}
                  className="hover:text-blue-400 transition-colors focus:outline-none"
                >
                  {isPlaying ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6 sm:w-8 sm:h-8"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6 sm:w-8 sm:h-8"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={toggleMute}
                    className="hover:text-blue-400 transition-colors focus:outline-none"
                  >
                    {isMuted || volume === 0 ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 sm:w-6 sm:h-6"
                      >
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 sm:w-6 sm:h-6"
                      >
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 sm:w-6 sm:h-6"
                      >
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 overflow-hidden group-hover/volume:w-16 sm:group-hover/volume:w-20 transition-all duration-300 h-1 bg-gray-500 rounded-full appearance-none outline-none cursor-pointer"
                    style={{
                      WebkitAppearance: "none",
                      background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${isMuted ? 0 : volume * 100}%, #4b5563 ${isMuted ? 0 : volume * 100}%, #4b5563 100%)`,
                    }}
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
                    className={`hover:text-blue-400 transition-colors focus:outline-none flex items-center gap-1 ${showSettings ? "text-blue-400" : ""}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span className="text-xs hidden sm:inline-block border border-gray-500 rounded px-1 min-w-[32px] text-center">
                      {currentQuality === -1
                        ? "Auto"
                        : qualities[currentQuality]}
                    </span>
                  </button>
                )}

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="hover:text-blue-400 transition-colors focus:outline-none"
                >
                  {isFullscreen ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    >
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    >
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Metadata Panel below the video */}
        {!isFullscreen && (
          <div className="bg-black/80 border-t border-white/10 text-white shrink-0">
            <div className="px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl sm:text-2xl font-semibold break-all">
                      {media.originalName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/60">
                        {media.mediaType}
                      </span>
                      <span className="text-sm text-white/60">
                        {formatSize(media.size)}
                      </span>
                    </div>
                  </div>
                  {streamStatus && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-300">
                          Quality Processing:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            streamStatus.status === "completed"
                              ? "bg-emerald-100 text-emerald-900"
                              : streamStatus.status === "processing"
                                ? "bg-amber-100 text-amber-900"
                                : streamStatus.status === "failed"
                                  ? "bg-rose-100 text-rose-900"
                                  : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {streamStatus.status}{" "}
                          {streamStatus.progress > 0 &&
                          streamStatus.progress < 100
                            ? `${streamStatus.progress}%`
                            : ""}
                        </span>
                      </div>
                      {streamStatus.qualities?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {streamStatus.qualities.map((q, idx) => (
                            <span
                              key={idx}
                              className="bg-white/10 border border-white/15 text-white px-2.5 py-0.5 rounded-full text-xs font-medium"
                            >
                              {q}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(
                          `/watch?src=${encodeURIComponent(fallbackUrl)}`,
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      <span>Share</span>
                    </button>
                    {isDirectPlaybackLink ? (
                      <button
                        type="button"
                        disabled={directDownloadPending}
                        onClick={handleDirectPlaybackDownload}
                        className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
                      >
                        <span>
                          {directDownloadPending ? "Preparing…" : "Download"}
                        </span>
                      </button>
                    ) : (
                      <a
                        href={downloadHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                      >
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 sm:gap-3 text-sm text-gray-300 font-medium items-center">
                <span className="bg-white/10 px-3 py-1.5 rounded-full">
                  Video
                </span>
                <span className="bg-white/10 px-3 py-1.5 rounded-full">
                  {formatSize(media.size)}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-full ${media.access === "public" ? "bg-emerald-600/15 text-emerald-200" : "bg-amber-600/15 text-amber-200"}`}
                >
                  {media.access === "public" ? "Public" : "Private"}
                </span>
                {useFallback && (
                  <span className="ml-auto bg-rose-600/15 text-rose-200 px-3 py-1.5 rounded-full">
                    Direct MP4 Playback
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
