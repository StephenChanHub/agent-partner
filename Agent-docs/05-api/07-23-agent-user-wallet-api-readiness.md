# 07-23 Agent User Wallet API Readiness

Version: v1.8.17

## Current status

The user wallet page is sandbox-only in v1.8.17. It uses local mock data and does not call Core.

## Reserved production endpoints

```text
GET  /me/usage
GET  /billing/packages
POST /billing/recharge-orders
GET  /billing/recharge-orders
POST /billing/recharge-orders/{id}/mock-pay
GET  /billing/transactions
```

## Production integration principle

The future API layer should replace local mock state only. It should not require rewriting page layout, tabs, order cards, transaction cards, or token entry routing.

## Data ownership

- Recharge packages are owned by Billing / Pricing.
- Recharge orders are owned by Billing.
- Token transactions are owned by Agent Token Transaction service.
- User Web only reads and displays the result, except for creating recharge orders.
