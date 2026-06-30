# 12-25 Agent User Web Floating Shell Polish

Version: v1.8.16

## Scope

This version improves the user-facing home page and chat page interaction polish without connecting real backend data.

## Home page updates

- The user avatar and nickname are treated as one cohesive user profile component.
- The nickname is white and bold.
- The avatar remains blue `#0D21A5` with a white initial.
- The token badge keeps the same global Tokens style and adds hover lift.
- `Tokens` stays bold globally.

## Chat page updates

- The top chat header becomes a high-transparency floating glass layer.
- The bottom composer becomes a high-transparency floating glass layer.
- Both floating containers use high z-index so they always sit above the message area.
- The message area remains independently scrollable.
- Messages can visually pass underneath the top header and bottom composer because those containers are transparent.
- The right-edge themed scrollbar from v1.8.15 is preserved.

## Non-goals

- No real Core API call.
- No persistent chat history.
- No real audio recording or playback.
- No production authentication change.
