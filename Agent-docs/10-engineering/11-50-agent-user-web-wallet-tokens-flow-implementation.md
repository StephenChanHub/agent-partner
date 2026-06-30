# 11-50 Agent User Web Wallet & Tokens Flow Implementation

Version: v1.8.17

## Files added

```text
Agent-user web/src/pages/WalletPage.tsx
Agent-user web/src/pages/WalletPage.css
Agent-user web/src/api/walletApi.ts
```

## Files updated

```text
Agent-user web/src/App.tsx
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/src/pages/ChatPage.tsx
Agent-user web/src/pages/ChatPage.css
Agent-user web/package.json
Agent-user web/README.md
README.md
```

## Routing

The lightweight router now supports:

```text
/              Home
/chat/:agentId Chat
/wallet        Wallet / recharge / token flow
```

## Token entry rule

All visible user-facing token balance badges should navigate to `/wallet`.

Current entries:

- Home bottom-right token badge.
- Chat header token badge.

## Styling rule

- `Tokens` word remains bold and uses the personalized token font.
- Token badges keep hover lift feedback.
- Wallet UI keeps the same blue / white / glass visual language as the rest of user web.
- Chat floating input shell is intentionally more readable: lower transparency and stronger blur.
