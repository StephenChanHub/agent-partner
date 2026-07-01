# 11-61 Agent User Mobile Home Physical Motion Implementation

## Changed files

- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/package.json`
- `README.md`
- `Agent-user web/README.md`

## Implementation details

### Header layout

`HomePage.tsx` now groups `brand-text` and `home-token-badge` inside `home-brand-stack`.

Mobile CSS overrides the token badge from fixed positioning to normal header flow. This places it directly below `DID Agent Partner` while preserving the desktop floating token badge.

### Select spacing

The final mobile CSS override forces:

```css
.stage-copy {
  margin: 20px 0 !important;
}
```

This normalizes the distance above and below the title block.

### Native deck preservation

The deck still renders all Agents:

```tsx
const visibleCards = cards;
```

Each card receives a stable key from `agent.id`, and switching changes only its `data-distance` slot.

### Motion state

`HomePage.tsx` adds:

```ts
const [switchDirection, setSwitchDirection] = useState<'next' | 'previous' | null>(null);
const switchTimerRef = useRef<number | null>(null);
const switchFrameRef = useRef<number | null>(null);
```

`goToIndex()` applies the switch direction before changing `activeIndex`. The active index update is delayed by two `requestAnimationFrame()` calls so CSS can pre-position the incoming candidate off-screen first.

### Physical motion CSS

Mobile CSS introduces:

- `--card-offscreen-y`
- `.agent-carousel--switch-next`
- `.agent-carousel--switch-previous`
- `.agent-carousel--dragging`

The incoming candidate is moved outside the viewport before the active slot changes. Once it becomes `data-distance="0"`, the browser transitions it into the center with native transform interpolation.

### Why this reduces flicker

Earlier versions relied on quick slot swaps and keyframe overrides. V1.8.29 keeps the mounted cards stable and uses slot-to-slot native transforms. This better matches how the browser compositor expects large gesture motion to happen.

## Install policy

`package-lock.json` remains omitted. Local developers should regenerate it with the public npm registry:

```bash
npm config set registry https://registry.npmjs.org/
npm install
```
