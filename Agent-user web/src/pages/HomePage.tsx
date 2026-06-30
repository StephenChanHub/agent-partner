import { type CSSProperties, type PointerEvent, useMemo, useRef, useState } from 'react';
import { AgentFlipCard } from '../components/AgentFlipCard';
import { InitialAvatar } from '../components/InitialAvatar';
import { UserAuthModal } from '../components/UserAuthModal';
import { useUserSession } from '../state/userSession';
import { homeAgents } from '../config/agents';
import './HomePage.css';

const SWIPE_THRESHOLD = 42;
const MAX_DRAG_X = 92;

type PointerState = {
  startX: number;
  currentX: number;
  pointerId: number;
  startedOnCardIndex: number | null;
};

function navigateToChat(agentId: string) {
  window.history.pushState({}, '', `/chat/${encodeURIComponent(agentId)}`);
  window.dispatchEvent(new Event('agent-user-web:navigate'));
}

function navigateToWallet() {
  window.history.pushState({}, '', '/wallet');
  window.dispatchEvent(new Event('agent-user-web:navigate'));
}

function navigateToProfile() {
  window.history.pushState({}, '', '/profile');
  window.dispatchEvent(new Event('agent-user-web:navigate'));
}

function formatTokens(value: number) {
  return value.toLocaleString('en-US');
}

export function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const session = useUserSession();

  const pointerState = useRef<PointerState | null>(null);
  const dragged = useRef(false);

  const activeAgent = homeAgents[activeIndex];

  const cards = useMemo(
    () =>
      homeAgents.map((agent, index) => {
        const distance = index - activeIndex;
        const isActive = index === activeIndex;
        const isVisible = Math.abs(distance) <= 2;
        return { agent, index, distance, isActive, isVisible };
      }),
    [activeIndex],
  );

  const goToIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(homeAgents.length - 1, index));
    setActiveIndex(nextIndex);
  };

  const getCardIndexFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return null;
    const card = target.closest<HTMLElement>('[data-card-index]');
    if (!card) return null;
    const value = Number(card.dataset.cardIndex);
    return Number.isFinite(value) ? value : null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerState.current = {
      startX: event.clientX,
      currentX: event.clientX,
      pointerId: event.pointerId,
      startedOnCardIndex: getCardIndexFromTarget(event.target),
    };
    dragged.current = false;
    setDragX(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    if (!state) return;

    state.currentX = event.clientX;
    const nextDragX = event.clientX - state.startX;
    setDragX(Math.max(-MAX_DRAG_X, Math.min(MAX_DRAG_X, nextDragX)));

    if (Math.abs(nextDragX) > 7) {
      dragged.current = true;
    }
  };

  const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    if (!state) return;

    const deltaX = state.currentX - state.startX;
    const tapTargetIndex = state.startedOnCardIndex;

    pointerState.current = null;
    setDragX(0);

    try {
      event.currentTarget.releasePointerCapture(state.pointerId);
    } catch {
      // Browser may release pointer capture automatically.
    }

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      dragged.current = true;
      goToIndex(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
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
  };

  return (
    <main className="user-home-shell">
      <header className="user-home-header">
        <button
          className="home-user-profile"
          type="button"
          aria-label={session.isLoggedIn ? 'Open profile' : 'Open login'}
          onClick={() => {
            if (session.isLoggedIn) {
              navigateToProfile();
              return;
            }
            setIsAuthOpen(true);
          }}
        >
          <InitialAvatar name={session.nickname} size="sm" className="header-user-avatar" />
          <span className="home-user-nickname">{session.nickname}</span>
        </button>
        <div className="brand-text">DID Agent Partner</div>
      </header>

      <button className="home-token-badge" type="button" aria-label="Open token wallet" onClick={navigateToWallet}>
        <span className="token-word">Tokens</span>：{formatTokens(session.tokens)}
      </button>

      <section className="partner-stage" aria-labelledby="partner-title">
        <div className="stage-copy">
          <h1 id="partner-title">Select your partner</h1>
        </div>

        <div
          className="agent-carousel"
          aria-label="Agent partner cards"
          style={{ '--drag-x': `${dragX}px` } as CSSProperties}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
        >
          <div className="agent-card-deck" aria-live="polite">
            {cards.map(({ agent, index, distance, isActive, isVisible }) => (
              <AgentFlipCard
                key={agent.id}
                agent={agent}
                isActive={isActive}
                isVisible={isVisible}
                distance={distance}
                cardIndex={index}
                dragX={dragX}
                showStartButton
                onStart={() => navigateToChat(agent.id)}
              />
            ))}
          </div>
        </div>

        <div className="carousel-dots" aria-label={`Selected agent: ${activeAgent.name}`}>
          {homeAgents.map((agent, index) => (
            <button
              key={agent.id}
              className={`dot ${index === activeIndex ? 'dot--active' : ''}`}
              type="button"
              aria-label={`Show ${agent.name}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
      </section>
      {isAuthOpen ? <UserAuthModal onClose={() => setIsAuthOpen(false)} /> : null}
    </main>
  );
}
