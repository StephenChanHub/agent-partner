# 11-58 Agent User Flip Back & Mobile TikTok Implementation

Version: v1.8.26  
Scope: `Agent-user web`

## Base

This implementation is based on v1.8.24 and only changes the Agent card interaction model, mobile card switching behavior, and mobile zoom lock.

## Flip fix

The previous flip stack could leave the invisible front face or the flip container blocking the back face. The v1.8.26 fix applies these engineering rules:

- `.agent-card-inner` keeps `transform-style: preserve-3d`.
- `.agent-card-inner` uses `backface-visibility: visible` so the rotated parent does not hide its children.
- Only `.agent-card-face--front` and `.agent-card-face--back` use `backface-visibility: hidden`.
- Pointer events are assigned by flip state:
  - front state: front face `pointer-events: auto`, back face `pointer-events: none`
  - back state: back face `pointer-events: auto`, front face `pointer-events: none`
- The old flip-time whole-card pointer lock is removed from the React state path.

## Mobile TikTok switching

Mobile switching no longer uses horizontal side-card carousel gestures. `HomePage` now detects `(max-width: 640px)` and enters mobile carousel mode:

- only the active card is rendered
- vertical pointer delta controls card switching
- swipe up selects the next Agent
- swipe down selects the previous Agent
- horizontal drag offset is disabled on mobile
- media inner horizontal swipe is disabled in mobile TikTok mode to keep vertical switching reliable

## Mobile indicators

The original bottom dot row is repositioned on mobile:

- right side of the card stage
- vertical stack
- active dot stretches vertically
- glass pill background keeps the dots visible over the page

## Mobile zoom lock

Mobile zoom lock is implemented in two layers:

1. viewport metadata:
   - `minimum-scale=1.0`
   - `maximum-scale=1.0`
   - `user-scalable=no`
2. runtime protection:
   - prevents iOS gesture zoom events
   - prevents double-tap zoom
   - prevents ctrl/meta wheel zoom on mobile-style contexts

## Validation checklist

- front `i` flips to back
- back `i` flips to front
- back START is clickable
- mobile vertical swipe does not create overlapping cards
- mobile dots are right-side vertical
- mobile page cannot be pinch-zoomed or double-tap-zoomed
