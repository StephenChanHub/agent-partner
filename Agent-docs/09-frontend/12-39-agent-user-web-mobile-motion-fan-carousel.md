# 12-39 Agent User Web Mobile Motion Fan Carousel

Version: v1.8.31
Scope: `Agent-user web`

## Goal

The previous mobile fan carousel still felt unstable because horizontal gestures were simulated by manual pointer state and CSS variables. This version moves mobile card dragging to Motion so the deck can use spring-based drag return and more natural gesture response.

## Changes

### 1. Motion-powered mobile drag

Mobile Home now imports Motion from `motion/react` and uses a Motion deck container for the mobile carousel.

- Desktop keeps the original pointer-based carousel.
- Mobile uses `motion.div` with horizontal drag.
- Drag is elastic and returns by spring.
- Swipe threshold uses both drag offset and velocity.

### 2. 120% card container height

The mobile carousel container now reserves 120% of the card height:

```text
container height = card height * 1.2
vertical buffer = card height * 0.1 on each side
```

This gives the tilted side cards enough breathing room and reduces clipping or cramped movement during spring return.

### 3. Stable mounted card deck

The deck still renders all Agent cards as stable `AgentFlipCard` components. Switching only changes each card distance slot:

- `0`: active center card
- `-1`: previous side card
- `1`: next side card
- `99`: hidden non-neighbor card

No remounting is required for normal switching.

### 4. Mobile fan layout retained

Mobile remains visually aligned with desktop horizontal browsing, but with fan presentation:

- center card is normal and fully interactive;
- side cards are tilted, scaled down, blurred, and behind;
- status dots remain below the card and horizontal.

## Updated files

- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/package.json`
- `Agent-user web/README.md`
- `README.md`

## Dependency

Added:

```json
"motion": "^12.23.24"
```

## Notes

`package-lock.json` is intentionally omitted. Developers should run `npm install` locally using the public npm registry to generate a clean lock file.
