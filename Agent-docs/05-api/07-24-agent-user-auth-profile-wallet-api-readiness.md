# v1.8.18 User Web API Readiness - Auth, Profile & Wallet

The user web still runs locally with mock state. This version adds page-level structures that map cleanly to future Core APIs.

## Planned auth APIs

```http
POST /auth/login
POST /auth/register
GET  /me
PATCH /me/profile
```

## Planned wallet APIs

```http
GET  /me/wallet
GET  /billing/packages
POST /billing/recharge-orders
GET  /billing/recharge-orders
GET  /billing/transactions
```

## Sandbox behavior

- Login/register modal writes to localStorage.
- Wallet balance updates local user session state.
- Mock order creation creates a paid local order and credit transaction.
- Back navigation relies on browser history to preserve page context.
