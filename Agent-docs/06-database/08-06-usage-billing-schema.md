# Usage & Billing Schema v1.5.8

## 1. V1 数据库改动

Usage & Billing Foundation 使用一个核心表：

```text
usage_records
```

同时在 `users` 表保留轻量汇总字段：

```text
balance_tokens
used_tokens
last_seen_at
```

---

## 2. users 字段

```text
balance_tokens  当前 Agent Tokens 余额
used_tokens     历史累计消耗的 Agent Tokens
last_seen_at    用户最后上线时间
```

`balance_tokens` 和 `used_tokens` 是展示与快速判断用，不替代明细。

---

## 3. usage_records 表

用途：记录每一次 LLM / STT / TTS 的资源消耗和 Agent Tokens 扣费。

核心字段：

```text
id
user_id
agent_id
agent_session_id
runtime_event_id
model_profile_id
voice_profile_id
type
input_tokens
output_tokens
total_tokens
stt_seconds
tts_characters
raw_cost_cny
billing_multiplier
cost_tokens
pricing_snapshot
metadata
created_at
```

说明：

```text
raw_cost_cny        本次真实成本，单位 RMB
billing_multiplier  本次计费倍率，V1 默认 1.5
cost_tokens         最终扣除的 Agent Tokens
pricing_snapshot    本次价格规则快照
```

---

## 4. UsageRecordType

```text
LLM_USAGE
STT_USAGE
TTS_USAGE
MANUAL_ADJUSTMENT
SYSTEM_GRANT
```

说明：

```text
LLM_USAGE          大模型调用
STT_USAGE          语音转文字
TTS_USAGE          文字转语音
MANUAL_ADJUSTMENT  管理员手动调整
SYSTEM_GRANT       系统赠送初始余额
```

---

## 5. Agent Tokens 解释

V1 平台货币命名为：

```text
Agent Tokens
```

换算：

```text
1 RMB = 1000 Agent Tokens
平台扣费 = 真实成本 × 1.5
```

---

## 6. 为什么不做 balance_transactions

V1 为了轻量化，暂时不拆余额交易流水表。

原因：

```text
当前还没有真实支付
没有退款
没有订单
没有发票
没有多币种
```

V1 的余额调整可以先写入 `usage_records`，type 使用：

```text
MANUAL_ADJUSTMENT
SYSTEM_GRANT
```

V2 再拆出：

```text
billing_accounts
balance_transactions
orders
invoices
```

---

## 7. 索引建议

```text
user_id + created_at
agent_id + created_at
agent_session_id + created_at
runtime_event_id
type + created_at
```

这些索引可以支持：

```text
用户查看自己的用量
管理员查看用户用量
按 Agent 统计成本
按日期统计消耗
追踪某次 Runtime Event 的成本
```

---

## 8. V1 最终表数量

v1.5.8 后核心表仍为 12 张：

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

---

## 9. 迁移策略

新增字段默认值：

```text
balance_tokens = 0
used_tokens = 0
last_seen_at = null
billing_multiplier = 1.5
cost_tokens = 0
```

开发阶段可以给测试用户赠送初始余额。


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
