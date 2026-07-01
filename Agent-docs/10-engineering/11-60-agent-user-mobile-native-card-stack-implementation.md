# 11-60 Agent User Mobile Native Card Stack Implementation

## Version

v1.8.28

## Problem

The v1.8.27 mobile stacked card implementation used a derived three-card list: previous, active, and next. On switch, React replaced the list content immediately. On mobile browsers this could produce flicker, temporary overlap, and unstable visual stacking during quick swipes.

## Implementation

### Mounted all-card deck

`HomePage.tsx` now maps all `homeAgents` in mobile mode. Each card remains mounted with a stable `key={agent.id}`.

A loop-aware distance helper assigns stack slots:

```ts
function getLoopDistance(index: number, activeIndex: number, total: number) {
  if (index === activeIndex) return 0;
  if (index === (activeIndex - 1 + total) % total) return -1;
  if (index === (activeIndex + 1) % total) return 1;
  return 99;
}
```

### Native CSS transitions

`HomePage.css` introduces `.agent-carousel--mobile-native-stack`.

Cards transition between these transform slots:

- active: `translate3d(-50%, var(--drag-y), 80px) scale(1)`
- previous: `translate3d(-50%, -20% card height, -72px) scale(0.955)`
- next: `translate3d(-50%, +20% card height, -72px) scale(0.955)`
- hidden: `translate3d(-50%, 0, -160px) scale(0.90)` with opacity `0`

### Candidate behavior

Previous and next candidate cards are visible but non-interactive. They use:

- lower `z-index`
- slight blur
- softer shadow
- `pointer-events: none`

Only the active card can receive interactions.

### Flip state reset

`AgentFlipCard.tsx` resets `isFlipped` when `isActive` becomes false. This keeps inactive candidate cards from returning later in a stale back-side state.

## Validation checklist

- Mobile stack renders all cards in one deck.
- No remount flicker during vertical switching.
- Previous and next candidate cards protrude by 20% of active card height.
- Candidate cards are behind and softly blurred.
- Active card remains fully interactive.
- Circular switching still works.
- Desktop carousel behavior is unchanged.
