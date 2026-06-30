# 11-39 Agent User Web Stable Carousel Implementation

Version: v1.8.5

## Problem

The third-party liquid glass component introduced rendering instability in the home carousel. Because the UI requires a strict 3:4 card canvas and deterministic target-card click switching, the carousel must avoid layout-altering wrapper components.

## Implementation

Updated files:

```text
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/package.json
Agent-user web/README.md
README.md
```

## Dependency policy

Removed:

```json
"liquid-glass-react": "^1.1.1"
```

Restored User Web React baseline:

```json
"react": "^18.3.1",
"react-dom": "^18.3.1"
```

This keeps User Web independent from experimental peer dependency constraints and reduces sandbox setup friction.

## Pointer interaction model

The carousel stores this pointer state:

```ts
type PointerState = {
  startX: number;
  currentX: number;
  pointerId: number;
  startedOnCardIndex: number | null;
};
```

On `pointerdown`, the implementation resolves the closest `[data-card-index]` from the original event target. On `pointerup`, if the gesture was not a swipe, it switches to that card index.

This makes target-card click switching reliable even when cards overlap visually.

## Styling policy

The card bottom shadow is explicitly removed with:

```css
box-shadow: none !important;
filter: none !important;
```

The visual glass effect is implemented using:

```css
background: linear-gradient(...);
backdrop-filter: blur(28px) saturate(1.24);
border: 1px solid rgba(255, 255, 255, 0.72);
```

No pseudo-element shadow is used.

## Local run

```bash
cd "Agent-user web"
rm -rf node_modules package-lock.json
npm install
npm run dev
```
