import React, { useRef, useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Maximize, Minimize, Expand, Shrink, Settings, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SecureVideoPlayerProps {
  src: string;
  title: string;
  className?: string;
  allowFullscreen?: boolean;
  allowQualityChange?: boolean;
  allowExpanded?: boolean;
  theme?: 'light' | 'dark';
  cloudinaryPublicId?: string; // Add this for Cloudinary support
}

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({ 
  src, 
  title, 
  className = "w-full h-full rounded-lg object-cover",
  allowFullscreen = true,
  allowQualityChange = true,
  allowExpanded = true,
  theme = 'light',
  cloudinaryPublicId // Add this prop
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(src);
  const [originalDuration, setOriginalDuration] = useState(0);
  const [isQualitySwitching, setIsQualitySwitching] = useState(false);
  const [lastSeekTime, setLastSeekTime] = useState<number | null>(null);
  const [qualitySwitchCount, setQualitySwitchCount] = useState(0);
  const qualitySwitchRef = useRef<{ id: number; cancelled: boolean } | null>(null);

  // Extract Cloudinary public ID from URL if not provided as prop
  const getPublicIdFromUrl = (url: string): string | null => {
    try {
      // Handle different Cloudinary URL patterns
      // Pattern 1: Basic upload URL with public ID at the end
      let match = url.match(/\/video\/upload\/(?:v\d+\/)?(?:[^/]*\/)*([^/]+?)(?:\.[^.]+)?(?:\?.*)?$/);
      if (match) {
        return match[1];
      }
      
      // Pattern 2: URL with transformations
      match = url.match(/\/video\/upload\/[^/]*\/([^/]+?)(?:\.[^.]+)?(?:\?.*)?$/);
      if (match) {
        return match[1];
      }
      
      // Pattern 3: Extract from path segments
      const urlParts = new URL(url);
      const pathSegments = urlParts.pathname.split('/');
      const uploadIndex = pathSegments.indexOf('upload');
      
      if (uploadIndex >= 0 && uploadIndex < pathSegments.length - 1) {
        // Find the last segment that looks like a public ID
        for (let i = pathSegments.length - 1; i > uploadIndex; i--) {
          const segment = pathSegments[i];
          // Remove file extension if present
          const cleanSegment = segment.replace(/\.[^.]+$/, '');
          // Check if it's not a transformation parameter
          if (cleanSegment && !cleanSegment.startsWith('q_') && !cleanSegment.startsWith('h_') && !cleanSegment.startsWith('w_')) {
            return cleanSegment;
          }
        }
      }
      
      console.warn('Could not extract public ID from URL:', url);
      return null;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  };

  const publicId = cloudinaryPublicId || getPublicIdFromUrl(src);

  // Cloudinary video quality configurations
  const getCloudinaryUrl = (publicId: string, quality: string) => {
    // Use your actual Cloudinary cloud name
    const baseUrl = "https://res.cloudinary.com/dahat0phs/video/upload";
    
    switch (quality) {
      case '1080p':
        return `${baseUrl}/q_auto,h_1080/${publicId}.mp4`;
      case '720p':
        return `${baseUrl}/q_auto,h_720/${publicId}.mp4`;
      case '480p':
        return `${baseUrl}/q_auto,h_480/${publicId}.mp4`;
      case '360p':
        return `${baseUrl}/q_auto,h_360/${publicId}.mp4`;
      case 'auto':
      default:
        return `${baseUrl}/q_auto/${publicId}.mp4`;
    }
  };

  // Available quality options (you can modify based on your video sources)
  const qualityOptions = [
    { value: 'auto', label: 'Auto' },
    { value: '1080p', label: '1080p HD' },
    { value: '720p', label: '720p' },
    { value: '480p', label: '480p' },
    { value: '360p', label: '360p' },
  ];

  // Available playback speed options
  const speedOptions = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: 'Normal' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 1.75, label: '1.75x' },
    { value: 2, label: '2x' },
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Video event handlers
    const handleTimeUpdate = () => {
      if (!isQualitySwitching) {
        setCurrentTime(video.currentTime);
      }
    };
    const handleDurationChange = () => {
      setDuration(video.duration);
      // Store original duration only once
      if (originalDuration === 0) {
        setOriginalDuration(video.duration);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    // Fullscreen change handler
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Security event handlers
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventDrag = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Global keyboard handler for video controls
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      // Only restrict dangerous shortcuts globally
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'S')) || // Ctrl+S
        (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) || // Ctrl+Shift+I
        (e.key === 'F12') || // F12
        (e.ctrlKey && e.shiftKey && (e.key === 'c' || e.key === 'C')) || // Ctrl+Shift+C
        (e.ctrlKey && (e.key === 'u' || e.key === 'U')) // Ctrl+U
      ) {
        e.preventDefault();
        e.stopPropagation();
        toast({
          title: "Action Restricted",
          description: "This action is not allowed on video content.",
          variant: "destructive",
        });
      }
    };

    // Add all event listeners
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('contextmenu', preventContextMenu);
    video.addEventListener('dragstart', preventDrag);
    video.addEventListener('selectstart', preventSelection);
    document.addEventListener('keydown', handleGlobalKeydown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Prevent drag and drop
    video.addEventListener('dragover', (e) => e.preventDefault());
    video.addEventListener('drop', (e) => e.preventDefault());

    // Monitor for developer tools (basic detection)
    let devToolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          video.style.filter = 'blur(10px)';
          toast({
            title: "Content Protected",
            description: "Video content is blurred when developer tools are detected.",
            variant: "destructive",
          });
        }
      } else {
        if (devToolsOpen) {
          devToolsOpen = false;
          video.style.filter = 'none';
        }
      }
    };

    const devToolsInterval = setInterval(checkDevTools, 1000);

    // Controls auto-hide
    let controlsTimeout: NodeJS.Timeout;
    const showControlsTemporarily = () => {
      setShowControls(true);
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => showControlsTemporarily();
    const handleMouseLeave = () => {
      if (isPlaying) {
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => setShowControls(false), 1000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    // Click outside to close settings
    const handleClickOutside = (e: MouseEvent) => {
      if (showSettings && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    // Cleanup
    return () => {
      // Cancel any pending quality switch
      if (qualitySwitchRef.current) {
        qualitySwitchRef.current.cancelled = true;
      }
      
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('contextmenu', preventContextMenu);
      video.removeEventListener('dragstart', preventDrag);
      video.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('keydown', handleGlobalKeydown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('click', handleClickOutside);
      video.removeEventListener('dragover', (e) => e.preventDefault());
      video.removeEventListener('drop', (e) => e.preventDefault());
      clearInterval(devToolsInterval);
      clearTimeout(controlsTimeout);
      
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isPlaying, allowFullscreen, showSettings, originalDuration]);

  // Control functions
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const seekBackward = () => {
    if (videoRef.current && !isQualitySwitching) {
      const newTime = Math.max(0, videoRef.current.currentTime - 10);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const seekForward = () => {
    if (videoRef.current && !isQualitySwitching) {
      const totalDuration = videoRef.current.duration || originalDuration || duration;
      const newTime = Math.min(totalDuration, videoRef.current.currentTime + 10);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current && !isQualitySwitching) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    } else if (isQualitySwitching) {
      // Store the seek time to apply after quality switch completes
      setLastSeekTime(time);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleFullscreen = () => {
    if (!allowFullscreen) return;
    
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleQualityChange = (quality: string) => {
    // Prevent multiple simultaneous quality switches
    if (isQualitySwitching) {
      return;
    }
    
    const video = videoRef.current;
    if (!video || !publicId) {
      return;
    }

    // Cancel any previous quality switch operation
    if (qualitySwitchRef.current) {
      qualitySwitchRef.current.cancelled = true;
    }

    // Create new quality switch operation
    const switchId = qualitySwitchCount + 1;
    setQualitySwitchCount(switchId);
    qualitySwitchRef.current = { id: switchId, cancelled: false };
    
    setSelectedQuality(quality);
    setIsQualitySwitching(true);
    
    // Store current playback state more precisely
    const currentTimeBeforeSwitch = video.currentTime;
    const wasPlaying = !video.paused;
    const currentVolume = video.volume;
    const currentMuted = video.muted;
    const currentPlaybackRate = video.playbackRate;
        
    // Generate new Cloudinary URL with quality transformation
    const newSrc = getCloudinaryUrl(publicId, quality);
    
    // Pause video first
    if (wasPlaying) {
      video.pause();
    }
    
    // Clear any pending seek operation to avoid conflicts
    setLastSeekTime(null);
    
    // Create a promise-based approach for better control
    const switchQuality = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if this operation was cancelled
        if (qualitySwitchRef.current?.cancelled || qualitySwitchRef.current?.id !== switchId) {
          reject(new Error('Quality switch cancelled'));
          return;
        }

        let isResolved = false;
        let loadTimeout: NodeJS.Timeout;
        
        const cleanup = () => {
          clearTimeout(loadTimeout);
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplaythrough', handleCanPlayThrough);
          video.removeEventListener('error', handleError);
          video.removeEventListener('loadstart', handleLoadStart);
          video.removeEventListener('seeking', handleSeeking);
          video.removeEventListener('seeked', handleSeeked);
        };
        
        const resolveOnce = () => {
          if (!isResolved && qualitySwitchRef.current?.id === switchId) {
            isResolved = true;
            cleanup();
            resolve();
          }
        };
        
        const rejectOnce = (error: any) => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(error);
          }
        };
        
        const handleLoadStart = () => {
          // Check if cancelled
          if (qualitySwitchRef.current?.cancelled || qualitySwitchRef.current?.id !== switchId) {
            rejectOnce(new Error('Quality switch cancelled during load start'));
            return;
          }
        };
        
        const handleLoadedMetadata = () => {
          // Check if cancelled
          if (qualitySwitchRef.current?.cancelled || qualitySwitchRef.current?.id !== switchId) {
            rejectOnce(new Error('Quality switch cancelled during metadata load'));
            return;
          }
                    
          // Restore video properties
          video.volume = currentVolume;
          video.muted = currentMuted;
          video.playbackRate = currentPlaybackRate;
          
          // Set current time if valid and within bounds
          if (currentTimeBeforeSwitch > 0 && video.duration > 0 && currentTimeBeforeSwitch <= video.duration) {
            video.currentTime = currentTimeBeforeSwitch;
          }
        };

        let seekingHandled = false;
        const handleSeeking = () => {
        };

        const handleSeeked = () => {
          if (!seekingHandled) {
            seekingHandled = true;
            setCurrentTime(video.currentTime);
          }
        };
        
        const handleCanPlayThrough = () => {
          // Check if cancelled
          if (qualitySwitchRef.current?.cancelled || qualitySwitchRef.current?.id !== switchId) {
            rejectOnce(new Error('Quality switch cancelled during can play through'));
            return;
          }
          
          // Final time verification and correction
          const timeDifference = Math.abs(video.currentTime - currentTimeBeforeSwitch);
          if (currentTimeBeforeSwitch > 0 && timeDifference > 0.5 && video.duration > 0) {
            video.currentTime = Math.min(currentTimeBeforeSwitch, video.duration);
          }
          
          // Update UI state
          setCurrentTime(video.currentTime);
          
          // Resume playing if it was playing before
          if (wasPlaying) {
            video.play().then(() => {
              resolveOnce();
            }).catch((error) => {
              console.error('Error resuming playback for switch', switchId, error);
              resolveOnce(); // Still resolve, playback error is not critical for quality switch
            });
          } else {
            resolveOnce();
          }
        };
        
        const handleError = (error: Event) => {
          console.error('Error loading video quality for switch', switchId, error);
          rejectOnce(error);
        };
        
        // Add event listeners
        video.addEventListener('loadstart', handleLoadStart, { once: true });
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('canplaythrough', handleCanPlayThrough, { once: true });
        video.addEventListener('error', handleError, { once: true });
        video.addEventListener('seeking', handleSeeking);
        video.addEventListener('seeked', handleSeeked, { once: true });
        
        // Set timeout as fallback
        loadTimeout = setTimeout(() => {
          rejectOnce(new Error('Quality switch timeout'));
        }, 10000); // Reduced timeout to 10 seconds
        
        // Update source and load
        try {
          video.src = newSrc;
          setCurrentVideoSrc(newSrc);
          video.load();
        } catch (error) {
          rejectOnce(error);
        }
      });
    };
    
    // Execute the quality switch
    switchQuality()
      .then(() => {
        // Only update state if this is still the current operation
        if (qualitySwitchRef.current?.id === switchId) {
          setIsQualitySwitching(false);
          qualitySwitchRef.current = null;
        }
      })
      .catch((error) => {
        // Only handle error if this is still the current operation
        if (qualitySwitchRef.current?.id === switchId) {
          console.error('Quality switch failed for', switchId, error.message);
          setIsQualitySwitching(false);
          qualitySwitchRef.current = null;
          
          // Only show error if it's not a cancellation
          if (!error.message.includes('cancelled')) {
            toast({
              title: "Quality Change Failed",
              description: "Failed to load the selected quality. Reverting to original.",
              variant: "destructive",
            });
            
            // Revert to original source
            video.src = src;
            setCurrentVideoSrc(src);
            setSelectedQuality('auto');
            
            // Try to restore time on original video
            const restoreOriginal = () => {
              if (video.duration > 0 && currentTimeBeforeSwitch <= video.duration) {
                video.currentTime = currentTimeBeforeSwitch;
                setCurrentTime(currentTimeBeforeSwitch);
              }
              if (wasPlaying) {
                video.play().catch(console.error);
              }
            };
            
            if (video.readyState >= 2) {
              restoreOriginal();
            } else {
              video.addEventListener('loadeddata', restoreOriginal, { once: true });
              video.load();
            }
          }
        }
      });
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`relative overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} ${
      isExpanded ? 'fixed inset-x-4 inset-y-16 z-50' : ''
    } ${isFullscreen ? 'bg-black' : ''}`}>
      <div 
        ref={containerRef}
        className={`relative w-full ${isExpanded ? 'h-full' : 'aspect-video'} secure-video-container group outline-none`}
        onDoubleClick={allowFullscreen ? toggleFullscreen : undefined}
        tabIndex={0}
        onMouseEnter={() => containerRef.current?.focus()}
        onKeyDown={(e) => {
          // Handle keyboard events directly on container
          if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
          } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            seekBackward();
          } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            seekForward();
          } else if (e.code === 'ArrowUp') {
            e.preventDefault();
            // Volume up
            if (videoRef.current) {
              const newVolume = Math.min(volume + 0.1, 1);
              setVolume(newVolume);
              videoRef.current.volume = newVolume;
              if (newVolume > 0 && isMuted) {
                setIsMuted(false);
                videoRef.current.muted = false;
              }
            }
          } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            // Volume down
            if (videoRef.current) {
              const newVolume = Math.max(volume - 0.1, 0);
              setVolume(newVolume);
              videoRef.current.volume = newVolume;
              if (newVolume === 0) {
                setIsMuted(true);
                videoRef.current.muted = true;
              }
            }
          } else if (e.code === 'KeyF' && allowFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          } else if (e.code === 'KeyM') {
            e.preventDefault();
            toggleMute();
          }
        }}
      >
        <video
          ref={videoRef}
          src={currentVideoSrc} // Use dynamic source
          className={`${className} ${isFullscreen ? 'object-contain' : 'object-cover'}`}
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture={!allowFullscreen}
          playsInline
          crossOrigin="anonymous"
          style={{
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            pointerEvents: 'auto'
          } as React.CSSProperties}
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.oncontextmenu = () => false;
            }
          }}
          onClick={togglePlayPause}
        />
        
        {/* Loading overlay */}
        {duration === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Quality switching overlay */}
        {isQualitySwitching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <div className="text-sm font-medium">Switching quality...</div>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}>
          
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <h3 className="text-lg font-semibold truncate">{title}</h3>
            </div>
          </div>

          {/* Center Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/30 h-16 w-16 rounded-full opacity-80 hover:opacity-100 transition-all duration-300 transform hover:scale-110"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="relative h-1 bg-white/30 rounded-full cursor-pointer progress-bar"
                   onClick={(e) => {
                     if (isQualitySwitching) return; // Prevent seeking during quality switch
                     
                     const rect = e.currentTarget.getBoundingClientRect();
                     const percent = (e.clientX - rect.left) / rect.width;
                     const totalDuration = videoRef.current?.duration || originalDuration || duration;
                     
                     if (totalDuration > 0) {
                       const newTime = Math.min(Math.max(0, percent * totalDuration), totalDuration);
                       handleSeek(newTime);
                     }
                   }}>
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                  style={{ width: `${(currentTime / (videoRef.current?.duration || originalDuration || duration)) * 100}%` }}
                />
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"
                  style={{ left: `${(currentTime / (videoRef.current?.duration || originalDuration || duration)) * 100}%` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={seekBackward}
                  className="text-white hover:bg-white/30 h-8 w-8 p-0 transition-all duration-200 rounded-md"
                  title="Seek backward 10s (←)"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/30 h-8 w-8 p-0 transition-all duration-200 rounded-md"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={seekForward}
                  className="text-white hover:bg-white/30 h-8 w-8 p-0 transition-all duration-200 rounded-md"
                  title="Seek forward 10s (→)"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/30 h-8 w-8 p-0 transition-all duration-200 rounded-md"
                    title={isMuted ? "Unmute (M) • Volume: ↑↓" : "Mute (M) • Volume: ↑↓"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/30 rounded-lg cursor-pointer"
                    title="Volume (↑ Up / ↓ Down)"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Time Display */}
                <span className="text-sm text-white/80">
                  {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || originalDuration || duration)}
                </span>
                
                {/* Settings Button with Custom Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:bg-white/30 h-8 w-8 p-0 transition-all duration-200 rounded-md"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  {showSettings && (
                    <div 
                      className="absolute bottom-12 right-0 w-48 bg-black/95 border border-white/20 backdrop-blur-sm rounded-md p-3 z-[2147483647]"
                      style={{ zIndex: 2147483647 }}
                    >
                      <div className="space-y-4">
                        {/* Quality Settings */}
                        {allowQualityChange && (
                          <div>
                            <label className="text-xs text-white/80 mb-2 block">
                              Quality {isQualitySwitching && (
                                <span className="text-blue-400">(switching...)</span>
                              )}
                            </label>
                            <div className="relative">
                              <select
                                value={selectedQuality}
                                onChange={(e) => handleQualityChange(e.target.value)}
                                disabled={isQualitySwitching}
                                className={`w-full h-8 text-xs bg-black/70 border border-white/30 text-white rounded px-2 cursor-pointer focus:outline-none focus:border-white/50 ${
                                  isQualitySwitching ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {qualityOptions.map(option => (
                                  <option key={option.value} value={option.value} className="bg-black text-white">
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {isQualitySwitching && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Playback Speed Settings */}
                        <div>
                          <label className="text-xs text-white/80 mb-2 block">Playback Speed</label>
                          <div className="relative">
                            <select
                              value={playbackSpeed.toString()}
                              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                              className="w-full h-8 text-xs bg-black/70 border border-white/30 text-white rounded px-2 cursor-pointer focus:outline-none focus:border-white/50"
                            >
                              {speedOptions.map(option => (
                                <option key={option.value} value={option.value.toString()} className="bg-black text-white">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Expanded View Button */}
                {allowExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleExpanded}
                    className="text-white hover:bg-white/30 h-8 w-8 p-0 transition-all duration-200 rounded-md"
                    title={isExpanded ? "Exit expanded view" : "Expanded view"}
                  >
                    {isExpanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                  </Button>
                )}

                {/* Fullscreen Button */}
                {allowFullscreen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/30 h-8 w-8 p-0 transition-all duration-200 rounded-md"
                    title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security overlays */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{ 
            background: 'transparent',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        />
        
        {/* Watermark */}
        <div className="absolute bottom-20 right-2 bg-black/70 text-white px-3 py-1 text-xs rounded backdrop-blur-sm pointer-events-none z-20 font-medium">
          ElCentre
        </div>
      </div>

      {/* Expanded view close button */}
      {isExpanded && allowExpanded && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-30"
        >
          ×
        </Button>
      )}
    </Card>
  );
};
