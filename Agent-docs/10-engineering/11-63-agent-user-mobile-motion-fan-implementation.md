# 11-63 Agent User Mobile Motion Fan Implementation

Version: v1.8.31
Area: Frontend engineering

## Implementation summary

This version replaces mobile Home carousel manual drag handling with Motion-based drag.

## Mobile interaction flow

1. User touches the mobile carousel deck.
2. Motion owns horizontal drag and elastic movement.
3. `onDrag` updates a small CSS drag variable for fan depth response.
4. `onDragEnd` checks offset and velocity.
5. If threshold is reached, the carousel loops to the previous or next Agent.
6. Motion springs the deck back to `x = 0`.

## Why this is safer

The earlier mobile implementation mixed manual pointer capture, card transforms, and carousel state changes. That made the cards easy to flicker or overlap during fast gestures. Motion reduces this risk by keeping drag movement declarative and spring-driven.

## Container sizing rule

The mobile carousel container uses:

```css
height: calc(var(--mobile-card-height) * 1.2);
```

The active card is positioned with a 10% top buffer. This satisfies the requirement that the container height must be at least 20% higher than the card itself.

## Files changed

- `src/pages/HomePage.tsx`
- `src/pages/HomePage.css`
- `package.json`

## Validation checklist

- Mobile horizontal drag feels elastic.
- Releasing below threshold springs back without switching.
- Releasing above threshold or with enough velocity switches cards.
- Side cards remain blurred, tilted, and behind the active card.
- Center card remains clickable and flippable.
- Desktop carousel behavior is unchanged.
