# v1.8.21 Implementation Notes

## Files changed

- `Agent-user web/src/pages/ChatPage.css`
- `Agent-user web/src/pages/ProfilePage.tsx`
- `Agent-user web/src/pages/ProfilePage.css`
- `Agent-user web/src/components/AgentFlipCard.tsx`
- `Agent-user web/src/components/AgentFlipCard.css`
- `Agent-user web/package.json`

## Production readiness

The password block is intentionally separated from the existing profile save action. The UI can later call a dedicated Core endpoint such as `/auth/password/change` or `/me/password` without changing the Personal information save flow.

The sound button is rendered by local SVG rather than text or emoji, which makes it stable for web, mobile web, and future embedded WebView environments.
