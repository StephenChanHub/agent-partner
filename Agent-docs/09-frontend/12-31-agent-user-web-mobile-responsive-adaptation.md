# 12-31 Agent User Web Mobile Responsive Adaptation

Version: v1.8.22  
Scope: Agent-user web mobile responsive adaptation

## Goal

The user web client must work cleanly on mobile screens before real Core API integration. This version fixes mobile layout instability across the Home, Agent card, Chat, Wallet, Profile, and Auth modal screens.

## Mobile baseline

The user client now uses:

- `viewport-fit=cover` in `index.html`.
- `100dvh` / `100svh` viewport handling.
- CSS safe-area variables:
  - `--safe-top`
  - `--safe-right`
  - `--safe-bottom`
  - `--safe-left`
- Mobile tap highlight removal.
- Mobile overflow-x guardrails.

## Home page

Mobile behavior:

- Header respects safe-area top inset.
- Avatar + nickname remain one compact component.
- Brand text is clamped to prevent overflow.
- Agent carousel width and height are clamped to the visible viewport.
- Agent cards shrink progressively at `900px`, `520px`, and `380px` breakpoints.
- Tokens pill respects right and bottom safe areas.

## Agent card

Mobile behavior:

- Card width is reduced on smaller screens.
- Side-card opacity and offset are adjusted to avoid visual overflow.
- Control buttons, media dots, plus button, and START button are resized.
- Standalone Agent card overlay is constrained to mobile viewport height.
- Hover-only visual lift is reduced on mobile to avoid layout jitter.

## Chat page

Mobile behavior:

- Floating header respects top safe area.
- Floating composer respects bottom safe area.
- Message list uses full viewport height and scrolls independently.
- Top and bottom scroll padding prevent messages from being hidden below floating bars.
- Message bubbles, action buttons, input field, send button, and voice button are resized.
- Tokens pill is clamped on narrow screens.

## Wallet page

Mobile behavior:

- Header uses compact grid columns.
- Recharge packages stack from 4-column desktop to 2-column tablet to 1-column phone.
- Balance card and record cards shrink and stack cleanly.
- Wallet page respects safe-area padding.

## Profile page

Mobile behavior:

- Profile hero stacks vertically.
- Tokens module becomes full width.
- Personal form, password section, and general settings use mobile-safe card radii and field heights.
- Logout button compresses to an icon on small screens.

## Auth modal

Mobile behavior:

- Auth modal becomes a mobile-friendly bottom-sheet style card on narrow screens.
- Card uses max-height and internal scrolling for short screens.
- Login / register animation remains active without overflowing the viewport.

## Current limitation

This version is still sandbox-only. It does not introduce real auth, wallet, media upload, chat, LLM, TTS, or payment calls.
