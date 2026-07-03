import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, type PanInfo } from "motion/react";
import { AgentFlipCard } from "../components/AgentFlipCard";
import { InitialAvatar } from "../components/InitialAvatar";
import { UserAuthModal } from "../components/UserAuthModal";
import { useUserSession } from "../state/userSession";
import { fallbackHomeAgents, type HomeAgent } from "../config/agents";
import "./HomePage.css";

const SWIPE_THRESHOLD = 54;
const MOTION_SWIPE_VELOCITY = 520;
const MAX_DRAG_X = 92;
const MOBILE_QUERY = "(max-width: 640px)";

type PointerState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pointerId: number;
  startedOnCardIndex: number | null;
};

type MobileMotionMetrics = {
  viewportWidth: number;
  cardWidth: number;
  cardHeight: number;
  deckHeight: number;
};

type MotionCardLayout = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  filter: string;
  zIndex: number;
};

function navigateToChat(agentId: string) {
  window.history.pushState({}, "", `/chat/${encodeURIComponent(agentId)}`);
  window.dispatchEvent(new Event("agent-user-web:navigate"));
}

function navigateToWallet() {
  window.history.pushState({}, "", "/wallet");
  window.dispatchEvent(new Event("agent-user-web:navigate"));
}

function navigateToProfile() {
  window.history.pushState({}, "", "/profile");
  window.dispatchEvent(new Event("agent-user-web:navigate"));
}

function formatTokens(value: number) {
  return value.toLocaleString("en-US");
}

function getCircularDistance(index: number, activeIndex: number, total: number) {
  if (index === activeIndex) return 0;

  let distance = index - activeIndex;
  const half = total / 2;

  if (distance > half) {
    distance -= total;
  }

  if (distance < -half) {
    distance += total;
  }

  return distance;
}

function getInitialMobileMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getInitialMotionMetrics(): MobileMotionMetrics {
  if (typeof window === "undefined") {
    const cardWidth = 342;
    const cardHeight = cardWidth * (4 / 3);
    return {
      viewportWidth: 390,
      cardWidth,
      cardHeight,
      deckHeight: cardHeight * 1.24,
    };
  }

  const viewportWidth = window.innerWidth;
  const cardWidth =
    viewportWidth <= 390
      ? Math.min(viewportWidth * 0.76, 292)
      : Math.min(viewportWidth * 0.78, 342);
  const cardHeight = cardWidth * (4 / 3);

  return {
    viewportWidth,
    cardWidth,
    cardHeight,
    deckHeight: cardHeight * 1.24,
  };
}

function useMobileCarouselMode() {
  const [isMobile, setIsMobile] = useState(getInitialMobileMode);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const syncMode = () => setIsMobile(mediaQuery.matches);

    syncMode();
    mediaQuery.addEventListener("change", syncMode);
    return () => mediaQuery.removeEventListener("change", syncMode);
  }, []);

  return isMobile;
}

function useMobileMotionMetrics() {
  const [metrics, setMetrics] = useState(getInitialMotionMetrics);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let frameId: number | null = null;
    const syncMetrics = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(() => {
        setMetrics(getInitialMotionMetrics());
        frameId = null;
      });
    };

    window.addEventListener("resize", syncMetrics, { passive: true });
    window.visualViewport?.addEventListener("resize", syncMetrics, {
      passive: true,
    });
    syncMetrics();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("resize", syncMetrics);
      window.visualViewport?.removeEventListener("resize", syncMetrics);
    };
  }, []);

  return metrics;
}

function getMotionFanLayout(
  distance: number,
  metrics: MobileMotionMetrics,
  dragOffsetX: number,
): MotionCardLayout {
  const absDistance = Math.abs(distance);
  const sign = Math.sign(distance);
  const isDragging = Math.abs(dragOffsetX) > 2;

  if (absDistance === 0) {
    return {
      x: dragOffsetX,
      y: 0,
      rotate: isDragging ? (dragOffsetX / metrics.cardWidth) * 6 : 0,
      scale: 1,
      opacity: 1,
      filter: "blur(0px) saturate(1) contrast(1)",
      zIndex: 60,
    };
  }

  if (absDistance > 2) {
    return {
      x: sign * metrics.cardWidth * 1.18 + dragOffsetX * 0.08,
      y: metrics.cardHeight * 0.18,
      rotate: sign * 24,
      scale: 0.66,
      opacity: 0,
      filter: "blur(7px) saturate(0.72) contrast(0.9)",
      zIndex: 1,
    };
  }

  const angle = distance * 16 * (Math.PI / 180);
  const radius = metrics.cardWidth * 2.12;
  const x = Math.sin(angle) * radius + dragOffsetX * 0.28;
  const y = (1 - Math.cos(angle)) * radius + absDistance * 10;

  return {
    x,
    y,
    rotate:
      distance * 10.8 +
      (isDragging ? (dragOffsetX / metrics.cardWidth) * 2.5 : 0),
    scale: Math.max(0.7, 1 - absDistance * 0.13),
    opacity: absDistance === 1 ? 0.62 : 0.24,
    filter:
      absDistance === 1
        ? "blur(2.2px) saturate(0.9) contrast(0.98)"
        : "blur(5.2px) saturate(0.78) contrast(0.92)",
    zIndex: 60 - absDistance * 14,
  };
}

/** Instant tracking during active drag for 1:1 finger following. */
const DRAG_TRANSITION = { type: "tween" as const, duration: 0.01 };

/**
 * Near-critically-damped spring.
 * damping ratio ≈ 33 / (2·√330) ≈ 0.908  →  slight underdamp for a subtle
 * "pop into place" snap feel without visible oscillation.
 */
const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 330,
  damping: 33,
  mass: 1.0,
};

function getMobileMotionTransition(isDragging: boolean) {
  if (isDragging) return DRAG_TRANSITION;
  return SPRING_TRANSITION;
}

export function HomePage({ agents, loadingAgents, agentsError }: { agents: HomeAgent[]; loadingAgents?: boolean; agentsError?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMotionDragging, setIsMotionDragging] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const session = useUserSession();
  const isMobileCarousel = useMobileCarouselMode();
  const mobileMetrics = useMobileMotionMetrics();

  const pointerState = useRef<PointerState | null>(null);
  const dragged = useRef(false);
  const motionDragged = useRef(false);
  const suppressNextDeckClick = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);

  const homeAgents = agents.length ? agents : fallbackHomeAgents;
  const activeAgent = homeAgents[Math.min(activeIndex, Math.max(0, homeAgents.length - 1))];

  useEffect(() => {
    if (activeIndex >= homeAgents.length) setActiveIndex(0);
  }, [activeIndex, homeAgents.length]);

  useEffect(() => {
    return () => {
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    };
  }, []);

  const cards = useMemo(() => {
    const total = homeAgents.length;

    return homeAgents.map((agent, index) => {
      const distance = isMobileCarousel
        ? getCircularDistance(index, activeIndex, total)
        : index - activeIndex;
      const isActive = index === activeIndex;
      const isVisible = isMobileCarousel
        ? Math.abs(distance) <= 2
        : Math.abs(distance) <= 2;

      return { agent, index, distance, isActive, isVisible };
    });
  }, [activeIndex, homeAgents, isMobileCarousel]);

  const visibleCards = cards;

  const goToIndex = (index: number) => {
    const total = homeAgents.length;
    const nextIndex = ((index % total) + total) % total;
    if (nextIndex === activeIndex) return;

    setActiveIndex(nextIndex);
    setDragOffsetX(0);
  };

  const getCardIndexFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return null;
    const card = target.closest<HTMLElement>("[data-card-index]");
    if (!card) return null;
    const value = Number(card.dataset.cardIndex);
    return Number.isFinite(value) ? value : null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerState.current = {
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      pointerId: event.pointerId,
      startedOnCardIndex: getCardIndexFromTarget(event.target),
    };
    dragged.current = false;
    setDragX(0);
    setDragY(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    if (!state) return;

    state.currentX = event.clientX;
    state.currentY = event.clientY;

    const nextDragX = event.clientX - state.startX;
    const nextDragY = event.clientY - state.startY;

    setDragX(Math.max(-MAX_DRAG_X, Math.min(MAX_DRAG_X, nextDragX)));
    setDragY(0);

    if (
      Math.abs(nextDragX) > 7 &&
      Math.abs(nextDragX) >= Math.abs(nextDragY) * 0.75
    ) {
      dragged.current = true;
    }
  };

  const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    if (!state) return;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const tapTargetIndex = state.startedOnCardIndex;

    pointerState.current = null;
    setDragX(0);
    setDragY(0);

    try {
      event.currentTarget.releasePointerCapture(state.pointerId);
    } catch {
      // Browser may release pointer capture automatically.
    }

    if (
      Math.abs(deltaX) >= SWIPE_THRESHOLD &&
      Math.abs(deltaX) >= Math.abs(deltaY) * 0.75
    ) {
      dragged.current = true;
      goToIndex(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
      dragged.current = false;
      return;
    }

    if (
      !dragged.current &&
      tapTargetIndex !== null &&
      tapTargetIndex !== activeIndex
    ) {
      goToIndex(tapTargetIndex);
    }

    dragged.current = false;
  };

  const handlePointerCancel = () => {
    pointerState.current = null;
    dragged.current = false;
    setDragX(0);
    setDragY(0);
  };

  const handleMotionDragStart = () => {
    if (!isMobileCarousel) return;
    motionDragged.current = false;
    setIsMotionDragging(true);
  };

  const handleMotionDrag = (
    _event: MouseEvent | TouchEvent | globalThis.PointerEvent,
    info: PanInfo,
  ) => {
    if (!isMobileCarousel) return;

    if (Math.abs(info.offset.x) > 6) {
      motionDragged.current = true;
    }

    // Track drag offset in real time so cards follow the finger
    setDragOffsetX(info.offset.x);
  };

  const handleMotionDragEnd = (
    _event: MouseEvent | TouchEvent | globalThis.PointerEvent,
    info: PanInfo,
  ) => {
    if (!isMobileCarousel) return;

    const deltaX = info.offset.x;
    const velocityX = info.velocity.x;
    const absDelta = Math.abs(deltaX);
    const absVelocity = Math.abs(velocityX);

    setIsMotionDragging(false);

    // --- Magnetic snap + inertia logic ---
    const meetsThreshold = absDelta >= SWIPE_THRESHOLD;
    const meetsVelocity = absVelocity >= MOTION_SWIPE_VELOCITY;
    // Magnetic zone: close to threshold with moderate velocity → snap through
    const inMagneticZone =
      absDelta >= SWIPE_THRESHOLD * 0.55 &&
      absVelocity >= MOTION_SWIPE_VELOCITY * 0.35;

    const shouldSwitch = meetsThreshold || meetsVelocity || inMagneticZone;

    if (shouldSwitch) {
      suppressNextDeckClick.current = true;
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressNextDeckClick.current = false;
        suppressClickTimerRef.current = null;
      }, 180);

      goToIndex(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
    } else {
      // Snap back — reset drag offset so cards spring to their base positions
      setDragOffsetX(0);
    }

    window.setTimeout(() => {
      motionDragged.current = false;
    }, 0);
  };

  const handleMotionDeckClick = (
    event: import("react").MouseEvent<HTMLDivElement>,
  ) => {
    if (
      !isMobileCarousel ||
      suppressNextDeckClick.current ||
      motionDragged.current
    )
      return;

    const targetIndex = getCardIndexFromTarget(event.target);
    if (targetIndex !== null && targetIndex !== activeIndex) {
      goToIndex(targetIndex);
    }
  };

  const renderDesktopCards = () =>
    visibleCards.map(({ agent, index, distance, isActive, isVisible }) => (
      <AgentFlipCard
        key={agent.id}
        agent={agent}
        isActive={isActive}
        isVisible={isVisible}
        distance={distance}
        cardIndex={index}
        dragX={dragX}
        showStartButton
        allowMediaSwipe
        className={isActive ? "agent-card--home-selected" : undefined}
        onStart={() => navigateToChat(agent.id)}
      />
    ));

  const renderMobileMotionCards = () =>
    visibleCards.map(({ agent, index, distance, isActive, isVisible }) => {
      const layout = getMotionFanLayout(distance, mobileMetrics, dragOffsetX);
      const isSideCandidate = Math.abs(distance) === 1;
      const isFarCandidate = Math.abs(distance) === 2;

      return (
        <motion.div
          key={agent.id}
          className={[
            "agent-motion-card-slot",
            isActive ? "agent-motion-card-slot--active" : "",
            isSideCandidate ? "agent-motion-card-slot--side" : "",
            isFarCandidate ? "agent-motion-card-slot--far" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-card-index={index}
          data-motion-distance={distance}
          aria-hidden={!isVisible}
          animate={layout}
          initial={false}
          transition={getMobileMotionTransition(isMotionDragging)}
          onClick={(event) => {
            event.stopPropagation();
            if (
              suppressNextDeckClick.current ||
              motionDragged.current ||
              isActive
            ) {
              return;
            }
            goToIndex(index);
          }}
        >
          <AgentFlipCard
            agent={agent}
            isActive={isActive}
            isVisible={isVisible}
            distance={distance}
            cardIndex={index}
            showStartButton
            allowMediaSwipe={false}
            mode="standalone"
            className={[
              "agent-card--motion-contained",
              isActive ? "agent-card--home-selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onStart={() => navigateToChat(agent.id)}
          />
        </motion.div>
      );
    });

  const deck = isMobileCarousel ? (
    <motion.div
      className="agent-card-deck agent-motion-fan-deck"
      aria-live="polite"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.24}
      dragMomentum={false}
      dragDirectionLock
      onDragStart={handleMotionDragStart}
      onDrag={handleMotionDrag}
      onDragEnd={handleMotionDragEnd}
      onClick={handleMotionDeckClick}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.82 }}
    >
      {renderMobileMotionCards()}
    </motion.div>
  ) : (
    <div className="agent-card-deck" aria-live="polite">
      {renderDesktopCards()}
    </div>
  );

  return (
    <main className="user-home-shell">
      <header className="user-home-header">
        <button
          className="home-user-profile"
          type="button"
          aria-label={session.isLoggedIn ? "Open profile" : "Open login"}
          onClick={() => {
            if (session.isLoggedIn) {
              navigateToProfile();
              return;
            }
            setIsAuthOpen(true);
          }}
        >
          <InitialAvatar
            name={session.nickname}
            size="sm"
            className="header-user-avatar"
          />
          <span className="home-user-nickname">{session.nickname}</span>
        </button>
        <div className="home-brand-stack">
          <div className="brand-text">DID Agent Partner</div>
          <button
            className="home-token-badge"
            type="button"
            aria-label="Open token wallet"
            onClick={navigateToWallet}
          >
            <span className="token-word">Tokens</span>：
            {formatTokens(session.tokens)}
          </button>
        </div>
      </header>

      <section className="partner-stage" aria-labelledby="partner-title">
        <div className="stage-copy">
          <h1 id="partner-title">Select your partner</h1>
          {loadingAgents ? <p className="agent-sync-note">Loading latest published agents…</p> : null}
          {agentsError ? <p className="agent-sync-note agent-sync-note--warning">Using fallback sample agent because Core API is unavailable.</p> : null}
        </div>

        <div
          className={[
            "agent-carousel",
            isMobileCarousel ? "agent-carousel--mobile-motion-rebuild" : "",
            isMobileCarousel && isMotionDragging
              ? "agent-carousel--dragging"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Agent partner cards"
          style={
            {
              "--drag-x": `${isMobileCarousel ? 0 : dragX}px`,
              "--drag-y": `${dragY}px`,
            } as CSSProperties
          }
          {...(!isMobileCarousel
            ? {
                onPointerDown: handlePointerDown,
                onPointerMove: handlePointerMove,
                onPointerUp: finishPointer,
                onPointerCancel: handlePointerCancel,
                onLostPointerCapture: handlePointerCancel,
              }
            : {})}
        >
          {deck}
        </div>

        <div
          className="carousel-dots"
          aria-label={`Selected agent: ${activeAgent.name}`}
        >
          {homeAgents.map((agent, index) => (
            <button
              key={agent.id}
              className={`dot ${index === activeIndex ? "dot--active" : ""}`}
              type="button"
              aria-label={`Show ${agent.name}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
      </section>
      {isAuthOpen ? (
        <UserAuthModal onClose={() => setIsAuthOpen(false)} />
      ) : null}
    </main>
  );
}
