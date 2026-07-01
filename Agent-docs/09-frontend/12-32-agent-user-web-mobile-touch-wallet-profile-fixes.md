# 12-32 Agent User Web Mobile Touch, Wallet & Profile Fixes

Version: v1.8.23

## Scope

This version fixes mobile usability problems discovered after the comprehensive responsive pass.

## Home Agent card

- Agent carousel swipe works when the card has no local media.
- Internal media swipe only captures gestures when the active card has at least two media items.
- `i` and sound buttons are centered using flex layout.
- Flip interaction is guarded for 1s to avoid repeated taps during animation.
- Card faces use stronger `translateZ`, `backface-visibility`, and 3D transform isolation to reduce mobile half-flip rendering bugs.

## Chat page

All icon buttons are centered consistently:

- Back button
- Copy button
- Play button
- Send button
- Voice button

The fix uses shared flex centering rules and removes alignment dependence on glyph metrics.

## Wallet page

The balance is rebuilt as a wheel-style rolling number animation. Each digit has a fixed-width masked wheel, inspired by the uploaded clock/timer reference.

The balance should remain stable on desktop and mobile, including values with commas.

## Profile page

- Mobile profile identity keeps avatar and nickname in one row.
- Logout remains text on mobile and no longer changes into a back-style symbol.

## Non-goals

- No real API integration.
- No persistent upload.
- No real payment.
- No production auth.
