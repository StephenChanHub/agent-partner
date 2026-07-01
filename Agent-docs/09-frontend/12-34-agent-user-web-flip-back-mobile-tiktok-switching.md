# 12-34 Agent User Web Flip Back & Mobile TikTok Switching

Version: v1.8.26  
Scope: `Agent-user web`

## Problem

The v1.8.24 mobile card improvements removed side-card display, but the Agent flip stack still had two critical issues:

1. The card could flip to the back, but the back-side flip button could fail to flip it back.
2. Mobile horizontal card switching could still create overlap or gesture conflicts during fast swipes.

## User-facing changes

- Desktop and mobile Agent cards now use the same corrected two-sided flip model.
- The visible card face is the only face that can receive pointer events.
- The hidden face cannot intercept clicks or taps.
- Mobile card switching changes from horizontal carousel gestures to TikTok-style vertical swipe gestures.
- Mobile Home renders only the active Agent card, removing side-card overlap conditions.
- Carousel status dots move to the right side and stack vertically on mobile.
- Mobile page zoom is locked globally.

## Interaction contract

### Desktop

- Front `i` button flips to the back.
- Back `i` button flips to the front.
- Front and back START buttons remain clickable.
- Desktop keeps the existing horizontal carousel behavior.

### Mobile

- Swipe up: next Agent.
- Swipe down: previous Agent.
- Only one Agent card is rendered in the mobile deck.
- Right-side vertical dots show current Agent position.
- Card front/back flip buttons remain active.
- Page zoom is disabled to prevent accidental layout scaling.

## Files changed

- `Agent-user web/src/components/AgentFlipCard.tsx`
- `Agent-user web/src/components/AgentFlipCard.css`
- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/src/main.tsx`
- `Agent-user web/src/styles/global.css`
- `Agent-user web/src/utils/lockMobileZoom.ts`
- `Agent-user web/index.html`
- `Agent-user web/package.json`
