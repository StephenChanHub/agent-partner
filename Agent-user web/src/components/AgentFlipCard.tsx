import {
  type ChangeEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { InitialAvatar } from './InitialAvatar';
import { type HomeAgent } from '../config/agents';
import './AgentFlipCard.css';

const SWIPE_THRESHOLD = 42;

type MediaPointerState = {
  startX: number;
  currentX: number;
  pointerId: number;
};

type LocalMediaItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
};

type AgentFlipCardProps = {
  agent: HomeAgent;
  isActive?: boolean;
  isVisible?: boolean;
  distance?: number;
  cardIndex?: number;
  dragX?: number;
  showStartButton?: boolean;
  mode?: 'carousel' | 'standalone';
  className?: string;
  onStart?: (agent: HomeAgent) => void;
};

function isVideoFile(file: File) {
  return file.type.startsWith('video/');
}

function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

function SoundWaveIcon() {
  return (
    <svg className="sound-wave-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8.6 8.4a4.9 4.9 0 0 1 0 7.2" />
      <path d="M12.1 6.1a8.2 8.2 0 0 1 0 11.8" />
      <path d="M15.7 3.9a11.4 11.4 0 0 1 0 16.2" />
    </svg>
  );
}

export function AgentFlipCard({
  agent,
  isActive = true,
  isVisible = true,
  distance = 0,
  cardIndex,
  dragX = 0,
  showStartButton = true,
  mode = 'carousel',
  className = '',
  onStart,
}: AgentFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>([]);
  const [mediaIndex, setMediaIndex] = useState(0);

  const mediaPointerState = useRef<MediaPointerState | null>(null);
  const mediaDragged = useRef(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const createdObjectUrls = useRef<string[]>([]);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const currentIndex = Math.min(mediaIndex, Math.max(0, mediaItems.length - 1));
  const currentMedia = mediaItems[currentIndex] ?? null;

  useEffect(() => {
    return () => {
      createdObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdObjectUrls.current = [];
    };
  }, []);

  useEffect(() => {
    setIsFlipped(false);
  }, [agent.id]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([mediaId, video]) => {
      if (!video) return;
      if (!currentMedia || mediaId !== currentMedia.id || currentMedia.type !== 'video' || !isActive || isFlipped) {
        video.pause();
        return;
      }

      video.currentTime = 0;
      video.muted = true;
      video.playsInline = true;

      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Browser autoplay policies may block playback. The preview remains visible.
        });
      }
    });
  }, [agent.id, currentMedia?.id, isActive, isFlipped]);

  const shiftMediaIndex = (direction: 'next' | 'previous') => {
    if (mediaItems.length < 2) return;
    const nextIndex = direction === 'next' ? (currentIndex + 1) % mediaItems.length : (currentIndex - 1 + mediaItems.length) % mediaItems.length;
    setMediaIndex(nextIndex);
  };

  const handleMediaPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    event.stopPropagation();
    mediaPointerState.current = {
      startX: event.clientX,
      currentX: event.clientX,
      pointerId: event.pointerId,
    };
    mediaDragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMediaPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = mediaPointerState.current;
    if (!state) return;
    event.stopPropagation();
    state.currentX = event.clientX;
    if (Math.abs(state.currentX - state.startX) > 7) {
      mediaDragged.current = true;
    }
  };

  const finishMediaPointer = (event: PointerEvent<HTMLDivElement>) => {
    const state = mediaPointerState.current;
    if (!state) return;
    event.stopPropagation();

    const deltaX = state.currentX - state.startX;
    mediaPointerState.current = null;

    try {
      event.currentTarget.releasePointerCapture(state.pointerId);
    } catch {
      // Browser may release pointer capture automatically.
    }

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      shiftMediaIndex(deltaX < 0 ? 'next' : 'previous');
    }

    mediaDragged.current = false;
  };

  const cancelMediaPointer = (event?: PointerEvent<HTMLDivElement>) => {
    event?.stopPropagation();
    mediaPointerState.current = null;
    mediaDragged.current = false;
  };

  const openUploadPicker = () => {
    if (!isActive) return;
    uploadInputRef.current?.click();
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => isImageFile(file) || isVideoFile(file));
    if (!files.length) return;

    const existingLength = mediaItems.length;
    const nextItems = files.map((file) => {
      const url = URL.createObjectURL(file);
      createdObjectUrls.current.push(url);
      return {
        id: `${agent.id}_${Date.now()}_${file.name}_${Math.random().toString(16).slice(2)}`,
        type: isVideoFile(file) ? ('video' as const) : ('image' as const),
        url,
        name: file.name,
      };
    });

    setMediaItems((current) => [...current, ...nextItems]);
    setMediaIndex(existingLength);
    setIsFlipped(false);
    event.target.value = '';
  };

  const renderMediaDots = () => {
    const count = Math.max(mediaItems.length, 1);

    return (
      <div className="media-count-dots" aria-label={mediaItems.length ? 'Media preview position' : 'No media yet'}>
        {Array.from({ length: count }).map((_, dotIndex) => (
          <button
            key={`${agent.id}_dot_${dotIndex}`}
            className={`media-dot ${dotIndex === currentIndex ? 'media-dot--active' : ''}`}
            type="button"
            disabled={!isActive || !mediaItems.length}
            aria-label={`Show media ${dotIndex + 1}`}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (!isActive || !mediaItems.length) return;
              setMediaIndex(dotIndex);
            }}
          />
        ))}
      </div>
    );
  };

  const startButton = (variant: 'front' | 'back') => {
    if (!showStartButton) return null;

    return (
      <button
        className={`liquid-start-button liquid-start-button--${variant}`}
        type="button"
        disabled={!isActive}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          if (!isActive) return;
          onStart?.(agent);
        }}
      >
        START
      </button>
    );
  };

  const cardClasses = [
    'agent-card',
    mode === 'standalone' ? 'agent-card--standalone' : '',
    isActive ? 'agent-card--active' : '',
    isFlipped ? 'agent-card--flipped' : '',
    isVisible ? 'agent-card--visible' : 'agent-card--hidden',
    !showStartButton ? 'agent-card--no-start' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={cardClasses}
      data-distance={distance}
      data-card-index={cardIndex}
      aria-label={`${agent.name} agent card`}
      aria-hidden={!isVisible}
      style={mode === 'carousel' ? ({ '--drag-x': `${dragX}px` } as React.CSSProperties) : undefined}
    >
      <input
        ref={uploadInputRef}
        className="media-upload-input"
        type="file"
        accept="image/*,video/*"
        multiple
        aria-label={`Choose local image or video files for ${agent.name}`}
        onChange={handleUpload}
      />

      <div className="agent-card-inner">
        <div className="agent-card-face agent-card-face--front">
          <div
            className="media-frame"
            aria-label={`${agent.name} media preview`}
            onPointerDown={handleMediaPointerDown}
            onPointerMove={handleMediaPointerMove}
            onPointerUp={finishMediaPointer}
            onPointerCancel={cancelMediaPointer}
            onLostPointerCapture={cancelMediaPointer}
          >
            {mediaItems.length ? (
              <div
                className="media-slider-track"
                style={{ transform: `translate3d(calc(${currentIndex} * (-100% - 5px)), 0, 0)` }}
              >
                {mediaItems.map((media) => (
                  <div className="media-slide" key={media.id} aria-hidden={media.id !== currentMedia?.id}>
                    {media.type === 'image' ? (
                      <img className="media-fill" src={media.url} alt={media.name} draggable={false} />
                    ) : (
                      <video
                        ref={(element) => {
                          videoRefs.current[media.id] = element;
                        }}
                        className="media-fill"
                        src={media.url}
                        muted
                        playsInline
                        preload="metadata"
                        onEnded={(event) => {
                          const video = event.currentTarget;
                          video.pause();
                          if (Number.isFinite(video.duration) && video.duration > 0.08) {
                            video.currentTime = video.duration - 0.06;
                          }
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-media-state">
                <button
                  className="upload-plus-button"
                  type="button"
                  disabled={!isActive}
                  aria-label={`Add local media for ${agent.name}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    openUploadPicker();
                  }}
                >
                  +
                </button>
                <span>add local photo or video</span>
              </div>
            )}
          </div>

          <div className="card-top-controls">
            {renderMediaDots()}
            <div className="card-action-stack" aria-label="Card actions">
              <button
                className="liquid-action-button info-button"
                type="button"
                disabled={!isActive}
                aria-label={`Show ${agent.name} information`}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isActive) return;
                  setIsFlipped(true);
                }}
              >
                i
              </button>
              <button
                className="liquid-action-button sound-button"
                type="button"
                disabled={!isActive}
                aria-label={`Preview ${agent.name} voice`}
                title="Voice preview reserved"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <SoundWaveIcon />
              </button>
            </div>
          </div>

          {startButton('front')}
        </div>

        <div className="agent-card-face agent-card-face--back">
          <button
            className="liquid-action-button info-button info-button--back"
            type="button"
            disabled={!isActive}
            aria-label={`Return to ${agent.name} media`}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (!isActive) return;
              setIsFlipped(false);
            }}
          >
            i
          </button>

          <div className="agent-back-content">
            <InitialAvatar name={agent.name} size="xl" className="agent-avatar" />
            <h2>{agent.name}</h2>
            <p>{agent.description}</p>
          </div>

          {startButton('back')}
        </div>
      </div>
    </article>
  );
}
