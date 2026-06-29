# Usage & Billing Backend Modules v1.0

## 1. 模块目标

v1.5.4 新增 `usage` 模块，用来承接未来商业化的基础能力。

它不处理真实支付，只处理：

```text
用量采集
余额检查
用量明细
用户余额展示
管理员余额调整
```

---

## 2. 推荐目录

```text
src/modules/usage/
├── usage.module.ts
├── usage.controller.ts
├── usage.service.ts
├── usage-meter.service.ts
├── billing-guard.service.ts
├── dto/
│   ├── adjust-balance.dto.ts
│   └── usage-query.dto.ts
└── repositories/
    └── usage.repository.ts
```

---

## 3. UsageMeterService

负责把不同 Adapter 的返回结果变成标准用量。

输入来源：

```text
LLM Adapter usage
STT Adapter duration
TTS Adapter characters
```

输出：

```typescript
{
  type: 'LLM_USAGE',
  inputTokens: 120,
  outputTokens: 380,
  totalTokens: 500,
  costTokens: 500
}
```

---

## 4. BillingGuardService

负责余额检查。

V1 支持两种模式：

```text
TRACK_ONLY  只记录，不拦截
ENFORCE     余额不足时拒绝
```

Runtime 入口处可以调用：

```typescript
await billingGuard.assertCanUse(userId, estimatedCostTokens)
```

---

## 5. UsageService

负责写入用量并更新用户汇总字段。

流程：

```text
createUsageRecord
↓
increment users.used_tokens
↓
if ENFORCE or deduct enabled:
  decrement users.balance_tokens
```

注意：真实实现时建议使用数据库事务。

---

## 6. Runtime 集成点

文字模式：

```text
Chat Engine
↓
LLM Adapter
↓
Usage Meter
↓
Usage Service
```

语音模式：

```text
STT Adapter
↓
Usage Meter
↓
LLM Adapter
↓
Usage Meter
↓
TTS Adapter
↓
Usage Meter
↓
Usage Service
```

---

## 7. Controller 边界

普通用户：

```text
GET /me/usage
GET /me/usage-records
```

管理员：

```text
GET /studio/users/:id/usage
GET /studio/users/:id/usage-records
POST /studio/users/:id/balance/adjust
```

---

## 8. V1 不做

```text
不接支付 SDK
不做 webhook
不做复杂订单状态机；V1 仅做 PENDING / PAID / EXPIRED 轻量订单
不做退款
不做发票
```

这些留给商业化版本。


---

# v1.5.9 Recharge Orders Note

V1 已新增轻量充值订单和余额流水能力。相关完整说明见：

```text
03-domain/04-09-lightweight-recharge-orders-model.md
05-api/07-13-lightweight-recharge-orders-api.md
06-database/08-11-lightweight-recharge-orders-schema.md
09-frontend/12-03-wallet-recharge-orders-ui.md
10-engineering/11-23-lightweight-recharge-orders-module.md
```

关键规则：订单记录充值行为，流水记录余额变化，Usage 记录消费明细。所有余额变化都必须写 `agent_token_transactions`。
