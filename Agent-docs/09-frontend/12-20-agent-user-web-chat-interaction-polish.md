# Agent User Web Chat Interaction Polish

Version: v1.8.11

## Goal

This version improves the user-facing chat page interaction baseline while keeping the implementation sandbox-only and production-ready for later API integration.

## Changes

- Message actions are now icon buttons instead of text buttons.
- The composer input now has a send button inside the input shell using an upward arrow icon.
- Voice input is separated outside the input shell on the right side.
- Tapping the agent avatar/name in the top header opens an agent profile card overlay.
- The profile overlay intentionally has no `start` button because the user is already inside the conversation.
- Tapping the blank overlay area closes the profile card and returns to the conversation.

## Interaction Rules

```text
Header agent area click -> open agent card overlay
Overlay blank area click -> close overlay
Profile card click -> keep overlay open
Copy icon -> reserved copy action
Play icon -> reserved audio playback action
Send arrow -> reserved text send action
Voice button -> reserved voice input action
```

## Production Readiness

The UI is designed so that future real actions can be wired without changing the layout contract:

- Copy icon can call `navigator.clipboard.writeText(message.text)`.
- Play icon can call local cached audio or temp audio URL playback.
- Send arrow can call `/chat`.
- Voice button can open voice recording mode and call `/voice`.
- Agent profile overlay can be backed by `GET /agents/{slug}` or session-bound agent details.
