# 12-15 Agent User Web Stable CSS Glass Carousel

Version: v1.8.5

## Background

The previous implementation used `liquid-glass-react` to create a glass card surface. In the current carousel layout, the third-party component can create extra DOM, SVG, and filter layers. Those layers can interfere with fixed 3:4 card sizing, z-index stacking, pointer targeting, and visual clipping.

V1.8.5 replaces the third-party glass component with a pure CSS liquid glass surface.

## Design decision

Agent-user web now uses:

- React 18.3.1
- Vite
- TypeScript
- Pure CSS glass card background
- No third-party glass component

## UI changes

- Card container remains transparent.
- Card bottom light-blue shadow is fully removed.
- Card itself uses a translucent white glass surface with blur and saturation.
- Card ratio remains 3:4.
- Default design reference remains 900 × 1200.
- Global blue remains `#0D21A5`.
- Card spacing is increased.
- The spacing between “Select your partner” and cards is increased.

## Interaction changes

Carousel switching supports:

- Swipe left: next Agent.
- Swipe right: previous Agent.
- Click visible left / right target card: switch directly to that card.
- Click dot: switch to the selected Agent.

The click-target bug is fixed by resolving the target card index from `pointerdown` instead of relying on bubbling click handlers that can be affected by overlapping card layers.

## Non-goals

V1.8.5 still does not implement:

- API loading.
- Login state.
- Chat navigation.
- Avatar image display.
- Upload.
