# 11-39 Agent User Web Header & Card Shadow Implementation

## Version

v1.8.6

## Files

- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/package.json`

## Implementation Notes

### Header

`user-home-header` is now transparent and no longer uses blur, border, or box shadow. This keeps the top area visually clean and avoids conflict with the carousel cards.

### Header Avatar

The header avatar uses the existing `InitialAvatar` component with an extra `header-user-avatar` class. This keeps the global avatar policy consistent while allowing the header avatar to become a rounded square.

### Card Shadow

The carousel outer container and deck remain transparent. Card shadow is applied only to `.agent-card-glass`, so the visual depth belongs to the card itself.

Hover interaction is implemented through `.agent-card--visible:hover .agent-card-glass`.

## Production Readiness

This CSS-only approach avoids third-party glass dependencies and keeps the homepage stable for future API integration.
