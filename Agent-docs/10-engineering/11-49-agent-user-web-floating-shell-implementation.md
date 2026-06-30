# 11-49 Agent User Web Floating Shell Implementation

Version: v1.8.16

## Files changed

- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/src/pages/ChatPage.css`
- `Agent-user web/package.json`
- `Agent-user web/package-lock.json`
- `README.md`
- `Agent-user web/README.md`

## Implementation notes

### Home profile component

The existing `.home-user-profile` wrapper is upgraded into the canonical user profile component for the home header. It controls layout, glass surface, hover lift, and nickname grouping.

### Token badge

The `.home-token-badge` adds hover lift and stronger shadow while keeping the global token typography.

### Floating chat shell

The chat header and composer are moved to fixed floating layers:

- `.chat-header`: fixed top layer with `z-index: 120`.
- `.chat-composer`: fixed bottom layer with `z-index: 120`.
- `.chat-messages`: full-height scroll region with extra top and bottom padding so content can scroll underneath the transparent floating layers.

This keeps the UI close to an iOS-style floating glass interaction while preserving a simple DOM structure.
