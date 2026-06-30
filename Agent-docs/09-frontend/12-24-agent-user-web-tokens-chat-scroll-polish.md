# 12-24 Agent User Web Tokens & Chat Scroll Polish

Version: v1.8.15

## Purpose

This version improves the user-facing web client visual polish around user identity, Agent Tokens display, chat message motion, and scroll behavior.

## Scope

### Home page

- User nickname is rendered in white.
- `Tokens` label is bold and uses the same personalized font treatment as the chat page.
- The home token badge remains fixed at the lower-right corner.

### Chat page

- The top header glass surface is made more transparent.
- `Tokens` label is bold and visually consistent with the home page.
- Both user and agent messages use DOM entry animation.
- Agent sandbox replies are inserted as fresh message nodes after the thinking phase so the reply also receives animation.
- The message scroll container spans the full viewport width, while message rows remain centered.
- The scrollbar appears at the far-right side of the page and uses theme blue `#0D21A5`.

## Non-goals

- No real Core Chat API integration.
- No real token deduction.
- No real audio playback.
- No backend storage.

## Acceptance checklist

- Home nickname is white.
- Home `Tokens` label is visually bold.
- Chat `Tokens` label is visually bold.
- Chat header is visibly more transparent than v1.8.14.
- User messages animate when sent.
- Agent thinking messages animate when inserted.
- Agent final replies animate after thinking is replaced.
- Chat message area scrolls normally.
- Scrollbar is aligned to the right edge of the viewport and uses theme blue.
