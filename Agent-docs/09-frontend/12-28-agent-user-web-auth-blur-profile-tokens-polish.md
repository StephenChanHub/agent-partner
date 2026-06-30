# 12-28 Agent User Web Auth Blur & Profile Tokens Polish

Version: v1.8.19

## Scope

This version refines the user authentication modal and profile page for the Agent User Web sandbox.

## Updates

### Auth modal

- Login / register modal now applies a full-screen blur layer when opened.
- The background is intentionally blurred, darkened, and visually separated from the active auth card.
- The auth card remains centered, readable, and ready for future email verification / JWT integration.

### Profile page

- The profile overview card no longer displays `DID Agent Partner` or the user email.
- The profile overview card now shows:
  - user avatar
  - nickname
  - profile subtitle
  - Tokens balance on the right side
- The Tokens summary is clickable and routes to `/wallet`.
- The email field in the edit form is disabled.
- Disabled email uses a gray visual state and `not-allowed` cursor on hover.

## Production Readiness Notes

- Email remains immutable in the V1 user web profile editor.
- Future production email change should use a dedicated verification flow.
- Tokens summary should later read from Core `/me/usage` or wallet APIs.
