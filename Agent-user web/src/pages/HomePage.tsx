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
import { homeAgents } from "../config/agents";
import "./HomePage.css";

const SWIPE_THRESHOLD = 54;
const MOTION_SWIPE_VELOCITY = 520;
const MAX_DRAG_X = 92;
const MOBILE_SNAP_SWITCH_MS = 620;
const MOBILE_RELEASE_VELOCITY_CLAMP = 980;
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
  rotateX: number;
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
  isSwitching = false,
  releaseVelocity = 0,
): MotionCardLayout {
  const absDistance = Math.abs(distance);
  const sign = Math.sign(distance);
  const velocityBlur = Math.min(1.2, Math.abs(releaseVelocity) / 1200);

  if (absDistance === 0) {
    return {
      x: 0,
      y: -7,
      rotate: 0,
      rotateX: 0,
      scale: 1.035,
      opacity: 1,
      filter: isSwitching
        ? `blur(${(velocityBlur * 0.42).toFixed(2)}px) saturate(1.03) contrast(1)`
        : "blur(0px) saturate(1.02) contrast(1)",
      zIndex: 60,
    };
  }

  if (absDistance > 2) {
    return {
      x: sign * metrics.cardWidth * 1.18,
      y: metrics.cardHeight * 0.18,
      rotate: sign * 22,
      rotateX: 1.5,
      scale: 0.68,
      opacity: 0,
      filter: `blur(${(7 + velocityBlur).toFixed(2)}px) saturate(0.72) contrast(0.9)`,
      zIndex: 1,
    };
  }

  const angle = distance * 16 * (Math.PI / 180);
  const radius = metrics.cardWidth * 2.12;
  const x = Math.sin(angle) * radius;
  const y = (1 - Math.cos(angle)) * radius + absDistance * 10;

  return {
    x,
    y: y + 10,
    rotate: distance * 9.5,
    rotateX: absDistance === 1 ? 1.2 : 2.4,
    scale: Math.max(0.72, 1 - absDistance * 0.12),
    opacity: absDistance === 1 ? 0.60 : 0.22,
    filter:
      absDistance === 1
        ? `blur(${(2.1 + velocityBlur * 0.7).toFixed(2)}px) saturate(0.9) contrast(0.98)`
        : `blur(${(5.1 + velocityBlur * 0.8).toFixed(2)}px) saturate(0.78) contrast(0.92)`,
    zIndex: 60 - absDistance * 14,
  };
}

function getMobileMotionTransition(isDragging: boolean, releaseVelocity: number) {
  const velocity = Math.max(
    -MOBILE_RELEASE_VELOCITY_CLAMP,
    Math.min(MOBILE_RELEASE_VELOCITY_CLAMP, releaseVelocity),
  );

  if (isDragging) {
    return {
      type: "spring" as const,
      stiffness: 380,
      damping: 36,
      mass: 0.72,
      velocity: velocity * 0.18,
    };
  }

  return {
    type: "spring" as const,
    stiffness: 330,
    damping: 27,
    mass: 0.86,
    velocity: velocity * 0.28,
  };
}

export function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMotionDragging, setIsMotionDragging] = useState(false);
  const [releaseVelocityX, setReleaseVelocityX] = useState(0);
  const [switchDirection, setSwitchDirection] = useState<
    "next" | "previous" | null
  >(null);
  const session = useUserSession();
  const isMobileCarousel = useMobileCarouselMode();
  const mobileMetrics = useMobileMotionMetrics();

  const pointerState = useRef<PointerState | null>(null);
  const dragged = useRef(false);
  const motionDragged = useRef(false);
  const suppressNextDeckClick = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const switchTimerRef = useRef<number | null>(null);
  const switchFrameRef = useRef<number | null>(null);

  const activeAgent = homeAgents[activeIndex];

  useEffect(() => {
    return () => {
      if (switchTimerRef.current !== null) {
        window.clearTimeout(switchTimerRef.current);
      }
      if (switchFrameRef.current !== null) {
        window.cancelAnimationFrame(switchFrameRef.current);
      }
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
  }, [activeIndex, isMobileCarousel]);

  const visibleCards = cards;

  const resolveSwitchDirection = (nextIndex: number) => {
    const total = homeAgents.length;
    if (nextIndex === (activeIndex + 1) % total) return "next" as const;
    if (nextIndex === (activeIndex - 1 + total) % total)
      return "previous" as const;

    const forwardDistance = (nextIndex - activeIndex + total) % total;
    const backwardDistance = (activeIndex - nextIndex + total) % total;
    return forwardDistance <= backwardDistance
      ? ("next" as const)
      : ("previous" as const);
  };

  const goToIndex = (
    index: number,
    direction?: "next" | "previous",
    releaseVelocity = 0,
  ) => {
    const total = homeAgents.length;
    const nextIndex = ((index % total) + total) % total;
    if (nextIndex === activeIndex) return;

    const nextDirection = direction ?? resolveSwitchDirection(nextIndex);
    if (switchTimerRef.current !== null) {
      window.clearTimeout(switchTimerRef.current);
    }
    if (switchFrameRef.current !== null) {
      window.cancelAnimationFrame(switchFrameRef.current);
      switchFrameRef.current = null;
    }

    setReleaseVelocityX(releaseVelocity);
    setSwitchDirection(nextDirection);
    setActiveIndex(nextIndex);

    switchTimerRef.current = window.setTimeout(() => {
      setSwitchDirection(null);
      switchTimerRef.current = null;
    }, MOBILE_SNAP_SWITCH_MS);
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

    if (Math.abs(nextDragX) > 7 && Math.abs(nextDragX) >= Math.abs(nextDragY) * 0.75) {
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

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaX) >= Math.abs(deltaY) * 0.75) {
      dragged.current = true;
      goToIndex(
        deltaX < 0 ? activeIndex + 1 : activeIndex - 1,
        deltaX < 0 ? "next" : "previous",
        deltaX,
      );
      dragged.current = false;
      return;
    }

    if (!dragged.current && tapTargetIndex !== null && tapTargetIndex !== activeIndex) {
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

    if (Math.abs(info.offset.x) > 7) {
      motionDragged.current = true;
    }
  };

  const handleMotionDragEnd = (
    _event: MouseEvent | TouchEvent | globalThis.PointerEvent,
    info: PanInfo,
  ) => {
    if (!isMobileCarousel) return;

    const deltaX = info.offset.x;
    const velocityX = info.velocity.x;
    const hasDragged = Math.abs(deltaX) > 7 || Math.abs(velocityX) > 120;
    const shouldSwitch =
      Math.abs(deltaX) >= SWIPE_THRESHOLD ||
      Math.abs(velocityX) >= MOTION_SWIPE_VELOCITY;

    setIsMotionDragging(false);

    if (hasDragged) {
      suppressNextDeckClick.current = true;
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressNextDeckClick.current = false;
        suppressClickTimerRef.current = null;
      }, 110);
    }

    if (shouldSwitch) {
      goToIndex(
        deltaX < 0 ? activeIndex + 1 : activeIndex - 1,
        deltaX < 0 ? "next" : "previous",
        velocityX,
      );
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
        onStart={() => navigateToChat(agent.id)}
      />
    ));

  const renderMobileMotionCards = () =>
    visibleCards.map(({ agent, index, distance, isActive, isVisible }) => {
      const layout = getMotionFanLayout(
        distance,
        mobileMetrics,
        switchDirection !== null,
        releaseVelocityX,
      );
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
          transformTemplate={({ x, y, rotate, rotateX, scale }) =>
            `translate3d(${x}, ${y}, 0) translateZ(0) rotateX(${rotateX}) rotateZ(${rotate}) scale(${scale})`
          }
          transition={getMobileMotionTransition(isMotionDragging, releaseVelocityX)}
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
            className="agent-card--motion-contained"
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
      dragElastic={0.18}
      dragMomentum={false}
      dragDirectionLock
      onDragStart={handleMotionDragStart}
      onDrag={handleMotionDrag}
      onDragEnd={handleMotionDragEnd}
      onClick={handleMotionDeckClick}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 330, damping: 30, mass: 0.86 }}
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
        </div>

        <div
          className={[
            "agent-carousel",
            isMobileCarousel ? "agent-carousel--mobile-motion-rebuild" : "",
            isMobileCarousel && isMotionDragging
              ? "agent-carousel--dragging"
              : "",
            isMobileCarousel && switchDirection
              ? `agent-carousel--switch-${switchDirection}`
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
