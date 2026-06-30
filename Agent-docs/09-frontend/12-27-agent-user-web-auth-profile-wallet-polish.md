# v1.8.18 Agent User Web - Auth, Profile & Wallet Polish

## Scope

This version refines the user-side wallet entry, mock authentication, and profile surface while keeping the app sandbox-first.

## Wallet updates

- Removed the previous top `Wallet Tokens: 10000` title.
- Wallet header now shows user avatar + nickname in a horizontal layout.
- Nickname uses the platform theme blue `#0D21A5`.
- Creating a mock recharge order immediately updates the visible balance in sandbox mode.
- Balance display uses a slot-machine style rolling animation.
- The back button now returns to the previous page via browser history.

## Auth modal

- Home user identity component is the entry point.
- If the user is not logged in, clicking it opens a login/register modal.
- The login form is pre-filled with a demo account.
- Submitting the form stores a local mock user session.

## Profile page

- Added `/profile` route.
- When logged in, clicking the home user identity opens the profile page.
- The page includes editable nickname and email fields.
- General settings such as appearance and language are shown as reserved controls.
- No real backend write happens yet; the structure is ready for future `/me/profile` APIs.
