# Lightweight Recharge Orders API v1.5.9

## 1. API 范围

V1 支持轻量充值订单，但不接真实支付。

用户端：

```http
GET  /billing/packages
POST /billing/recharge-orders
GET  /billing/recharge-orders
GET  /billing/recharge-orders/:id
POST /billing/recharge-orders/:id/mock-pay
GET  /billing/transactions
```

管理员端：

```http
GET  /studio/users/:id/recharge-orders
GET  /studio/users/:id/transactions
POST /studio/users/:id/balance/adjust
```

支付预留：

```http
POST /billing/payment/webhook/wechat
POST /billing/payment/webhook/alipay
```

V1 webhook 路由可预留，但返回 Not Implemented。

## 2. 创建充值订单

```http
POST /billing/recharge-orders
```

请求：

```json
{
  "packageId": "pkg_5000"
}
```

响应：

```json
{
  "order": {
    "id": "order_xxx",
    "orderNo": "RO202606280001",
    "amountRmb": 5,
    "currency": "CNY",
    "agentTokens": 5000,
    "status": "PENDING",
    "paymentProvider": "MOCK",
    "paymentMethod": "MOCK",
    "createdAt": "2026-06-28T10:00:00Z",
    "expiresAt": "2026-06-28T10:15:00Z"
  }
}
```

## 3. 查询充值记录

```http
GET /billing/recharge-orders
```

用户端展示规则：

```text
PAID 展示
PENDING 且未过期展示
PENDING 且已过期不展示
EXPIRED 不展示
```

响应：

```json
{
  "items": [
    {
      "id": "order_xxx",
      "orderNo": "RO202606280001",
      "amountRmb": 5,
      "currency": "CNY",
      "agentTokens": 5000,
      "status": "PAID",
      "createdAt": "2026-06-28T10:00:00Z",
      "paidAt": "2026-06-28T10:01:00Z"
    }
  ],
  "nextCursor": null
}
```

## 4. Mock 支付成功

```http
POST /billing/recharge-orders/:id/mock-pay
```

V1 仅用于开发和测试。

成功后：

```text
订单 PENDING → PAID
用户余额增加
写入 agent_token_transactions
```

重复调用不得重复加余额。

## 5. 查询余额流水

```http
GET /billing/transactions
```

响应：

```json
{
  "items": [
    {
      "id": "txn_xxx",
      "type": "RECHARGE",
      "direction": "CREDIT",
      "amountTokens": 5000,
      "balanceBefore": 1000,
      "balanceAfter": 6000,
      "description": "Recharge order RO202606280001 paid",
      "createdAt": "2026-06-28T10:01:00Z"
    }
  ],
  "nextCursor": null
}
```

## 6. 管理员查看订单

```http
GET /studio/users/:id/recharge-orders
```

管理员端可以查看：

```text
PENDING
PAID
EXPIRED
```

用于排查和对账。

## 7. 管理员查看流水

```http
GET /studio/users/:id/transactions
```

管理员可以查看用户所有余额变化。

## 8. 管理员调整余额

```http
POST /studio/users/:id/balance/adjust
```

请求：

```json
{
  "direction": "CREDIT",
  "amountTokens": 5000,
  "reason": "Manual test grant"
}
```

必须写入 `agent_token_transactions`，类型为 `ADMIN_ADJUST`。

---

# v1.5.10 Update：Admin Manual Token Adjustment

管理员手动增加 Agent Tokens 使用独立接口：

```http
POST /studio/users/{id}/tokens/adjust
```

它不创建充值订单，只写余额流水。完整说明见：

```text
05-api/07-14-admin-manual-token-adjustment-api.md
```
