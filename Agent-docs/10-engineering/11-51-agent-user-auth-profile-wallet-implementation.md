# v1.8.18 Implementation Notes - User Auth, Profile & Wallet

## Added files

- `Agent-user web/src/state/userSession.ts`
- `Agent-user web/src/components/UserAuthModal.tsx`
- `Agent-user web/src/components/UserAuthModal.css`
- `Agent-user web/src/pages/ProfilePage.tsx`
- `Agent-user web/src/pages/ProfilePage.css`

## Updated files

- `Agent-user web/src/App.tsx`
- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/src/pages/WalletPage.tsx`
- `Agent-user web/src/pages/WalletPage.css`
- `Agent-user web/src/pages/ChatPage.tsx`

## Architecture note

The user web now has a local session abstraction:

```text
userSession.ts
  readUserSession()
  saveUserSession()
  updateUserSession()
  useUserSession()
```

This keeps the sandbox UI independent from real auth while making future replacement straightforward. Later, `userSession.ts` can delegate to Core APIs without rewriting page-level UI.

## Production API reservation

Future replacements:

- `POST /auth/login`
- `POST /auth/register`
- `GET /me`
- `PATCH /me/profile`
- `GET /me/wallet`
- `POST /billing/recharge-orders`
- `GET /billing/recharge-orders`
- `GET /billing/transactions`
