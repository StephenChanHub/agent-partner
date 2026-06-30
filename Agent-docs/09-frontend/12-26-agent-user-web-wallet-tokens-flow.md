# 12-26 Agent User Web Wallet & Tokens Flow

Version: v1.8.17

## Goal

Add a user-facing wallet page while keeping the app in sandbox mode. The page should feel ready for production integration without connecting to real payment or real token accounting yet.

## Scope

- Home user profile remains one transparent component: avatar + nickname, no wrapper background.
- Home `Tokens：10000` becomes a wallet entry and keeps hover lift feedback.
- Chat `Tokens：10000` becomes a wallet entry.
- Chat agent title remains background-free.
- Chat input shell becomes less transparent and more blurred for stronger glass readability.
- Add `/wallet` page.
- Wallet page includes recharge packages, recharge orders, and token transaction flow.

## Wallet page sections

1. Current balance card.
2. Recharge package cards.
3. Create mock order button.
4. Orders tab.
5. Token flow tab.

## Sandbox behavior

- `Create mock order` appends a local pending order.
- `Mock pay` marks the local order as paid and prepends a local credit transaction.
- No real backend call happens in v1.8.17.
- No real payment provider is invoked.
- Expired unpaid order filtering remains a backend responsibility for production.

## Production-ready contract

The UI is structured around the future Core endpoints:

- `GET /me/usage`
- `GET /billing/packages`
- `POST /billing/recharge-orders`
- `GET /billing/recharge-orders`
- `POST /billing/recharge-orders/{id}/mock-pay`
- `GET /billing/transactions`

When Core is connected, local state in `WalletPage` can be replaced by a wallet API client without changing the page interaction model.
