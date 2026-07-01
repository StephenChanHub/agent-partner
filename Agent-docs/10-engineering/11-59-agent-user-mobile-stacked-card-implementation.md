# 11-59 Agent User Mobile Stacked Card Implementation

## Version

v1.8.27

## Updated files

- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/src/components/AgentFlipCard.tsx`
- `Agent-user web/src/components/AgentFlipCard.css`
- `Agent-user web/src/pages/ChatPage.css`
- `Agent-user web/package.json`

## Implementation details

### Mobile rendering model

`HomePage.tsx` now renders three mobile cards instead of only the active card:

- `distance = -1`: previous Agent
- `distance = 0`: active Agent
- `distance = 1`: next Agent

The previous and next indexes are calculated circularly, so the card list loops in both directions.

### Mobile gesture model

The mobile carousel keeps vertical swipe navigation:

- negative delta Y moves to the next card
- positive delta Y moves to the previous card

A clamped `dragY` value is exposed as CSS custom property `--drag-y` so the active card can follow the finger slightly without disturbing the behind-card layers.

### Draw-card animation

The mobile carousel adds a temporary transition class:

- `agent-carousel--switch-next`
- `agent-carousel--switch-previous`

CSS keyframes draw the new active card from the bottom or top, matching the swipe direction.

### Layering

CSS uses `--stack-peek = card height * 0.2` to ensure candidate cards protrude by 20% of card height.

The active card uses a higher z-index and no blur. Candidate cards use lower z-index, slight blur, reduced opacity, and softer shadow.

### Flip interaction

`AgentFlipCard.css` adds a final guard where hidden faces are both `visibility: hidden` and `pointer-events: none`. The visible face is explicitly restored to `visibility: visible` and `pointer-events: auto`.

The front and back `i` controls also execute flip state changes on `pointerup` as well as `click`, improving reliability on transformed 3D layers.

### Chat top flush

`ChatPage.css` overrides the fixed chat header to `top: 0 !important` across desktop and mobile breakpoints.
