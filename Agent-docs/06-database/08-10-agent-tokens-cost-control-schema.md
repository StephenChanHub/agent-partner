# Agent Tokens Cost Control Schema v1.0

## 1. 本版本数据库目标

v1.5.8 不新增复杂支付表。

本版本只强化：

```text
users.balance_tokens
users.used_tokens
usage_records
```

让 Usage Record 可以表达：

```text
真实成本
计费倍率
最终扣除的 Agent Tokens
本次使用的价格快照
```

---

## 2. users 表语义更新

字段仍然保持：

```text
balance_tokens
used_tokens
```

但 V1.5.8 后正式解释为：

```text
balance_tokens  当前 Agent Tokens 余额
used_tokens     历史累计扣除的 Agent Tokens
```

---

## 3. usage_records 字段强化

原有字段：

```text
input_tokens
output_tokens
total_tokens
stt_seconds
tts_characters
cost_tokens
metadata
```

v1.5.8 增加建议字段：

```text
raw_cost_cny        本次真实成本，单位 RMB
billing_multiplier  本次计费倍率，V1 默认 1.5
pricing_snapshot    本次计费规则快照 JSON
```

`cost_tokens` 在 V1.5.8 后解释为：

```text
最终扣除的 Agent Tokens
```

---

## 4. 为什么需要 pricing_snapshot

模型价格、语音价格、平台倍率以后可能变化。

如果只保存最终扣费，未来无法解释历史账单。

所以每条 usage_records 可以保存当时的价格快照：

```json
{
  "currencyName": "Agent Tokens",
  "agentTokensPerRmb": 1000,
  "billingMultiplier": 1.5,
  "provider": "deepseek",
  "rates": {
    "inputCacheHitRmbPerMillion": 0.02,
    "inputCacheMissRmbPerMillion": 1,
    "outputRmbPerMillion": 2,
    "ttsRmbPer100kCharacters": 35
  }
}
```

---

## 5. 不新增 balance_transactions

V1 不新增：

```text
balance_transactions
orders
payments
invoices
```

原因：

```text
还没有真实支付
还没有退款
还没有发票
还没有多币种
还没有套餐购买
```

管理员手动调整余额仍然通过 usage_records 记录：

```text
MANUAL_ADJUSTMENT
SYSTEM_GRANT
```

---

## 6. Prisma 建议字段

```prisma
model UsageRecord {
  costTokens        Int      @default(0) @map("cost_tokens")
  rawCostCny        Decimal? @map("raw_cost_cny") @db.Decimal(12, 6)
  billingMultiplier Decimal? @default(1.50) @map("billing_multiplier") @db.Decimal(4, 2)
  pricingSnapshot   Json?    @map("pricing_snapshot")
}
```

---

## 7. V1 最终核心表数量

v1.5.8 仍然保持 12 张核心表：

```text
users
devices
agents
agent_versions
agent_sessions
messages
runtime_events
intent_records
action_records
model_profiles
voice_profiles
usage_records
```

不因为计费策略而引入复杂商业表。
