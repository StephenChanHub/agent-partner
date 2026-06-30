# 11-52 Agent User Auth Blur & Profile Tokens Implementation

Version: v1.8.19

## Implementation Summary

This update focuses on reducing visual noise in auth/profile flows and making profile balance information more prominent.

## Changed Files

- `Agent-user web/src/components/UserAuthModal.css`
- `Agent-user web/src/pages/ProfilePage.tsx`
- `Agent-user web/src/pages/ProfilePage.css`

## Auth Blur Implementation

The modal layer uses:

- `backdrop-filter: blur(34px) saturate(1.08)`
- semi-transparent dark overlay
- subtle radial highlight

The auth card itself still keeps its liquid glass style.

## Profile Tokens Implementation

Profile overview is split into:

- left identity block
- right token summary button

The token summary reuses the same product direction as the home/wallet tokens entry and navigates to `/wallet`.

## Email Immutability

The email input is disabled and styled with:

- gray background
- low-contrast text
- `cursor: not-allowed`
- disabled native state

This avoids implying that the email can be changed without a verification flow.
