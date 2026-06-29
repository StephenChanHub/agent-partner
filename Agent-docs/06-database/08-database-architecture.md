# 08. Database Architecture v1.5.7

## 1. 当前数据库原则

v1.5.7 遵守 V1 轻量化：

```text
能用 JSON Manifest 解决的展示和配置，不提前拆表。
真正需要查询、权限、计费和关联的数据，才独立建表。
```

因此：

```text
Agent Config Prompt → manifest.config.prompt
Agent 图片 / 视频 → manifest.social.galleryImages / galleryVideos
Model Library → model_profiles
Voice Library → voice_profiles
Usage → usage_records
```

## 2. V1 核心表

v1.5.7 最终锁定 12 张核心表：

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

删除 / 延后：

```text
skill_profiles    → V2
agent_media       → V2
memory_items      → V2
embeddings        → V2
payment_orders    → V2
```

## 3. 为什么删除 skill_profiles

V1 只做聊天，Persona / Capability / Behavior 本质上就是提示词。

所以 V1 不需要：

```text
SkillProfile 表
SkillProfile CRUD
Agent-Skill 关联表
```

V1 使用：

```text
agent_versions.manifest.config.prompt
```

## 4. 为什么不建 agent_media 表

V1 的图片和视频只用于 Agent 展示页。

因此放在 Manifest JSON：

```json
{
  "social": {
    "galleryImages": [],
    "galleryVideos": []
  }
}
```

V2 如果需要上传管理、审核、转码、CDN、多尺寸，再建：

```text
agent_media
```

## 5. Agent Manifest 存储

Agent 的所有可版本化配置保存在：

```text
agent_versions.manifest JSON
```

包括：

```text
identity
social
model
voice
config
runtime
```

其中：

```text
model.profileId → model_profiles.id
voice.profileId → voice_profiles.id
```

注意：这些是 JSON 内引用，V1 不使用数据库外键强约束。

## 6. 长会话记忆

V1 不建复杂 Memory 表。

`agent_sessions` 直接保存：

```text
summary
summary_updated_at
message_count
last_message_at
```

Context Builder 每次使用：

```text
config.prompt + session.summary + recent messages + current input
```

## 7. Usage / Billing

V1 使用：

```text
usage_records
```

记录：

```text
LLM tokens
STT seconds
TTS characters
cost tokens
```

`users` 表保存汇总字段：

```text
balance_tokens
used_tokens
```

V1 不接支付系统。

## 8. V1 ER 关系

```text
User 1 ─ N Device
User 1 ─ N AgentSession
Agent 1 ─ N AgentVersion
Agent 1 ─ N AgentSession
AgentSession 1 ─ N Message
RuntimeEvent 1 ─ 0/1 IntentRecord
RuntimeEvent 1 ─ N ActionRecord
User 1 ─ N UsageRecord
ModelProfile 1 ─ N UsageRecord
VoiceProfile 1 ─ N UsageRecord
```
---

# V1 Audio Storage 数据库边界

v1.5.6 正式确认：V1 不新增音频文件表。

```text
文字消息：messages 表保存
音频生成元信息：messages.metadata.audio 可选保存
临时音频文件：Runtime 临时缓存，不进 MySQL
Web 本地音频：IndexedDB，不进 MySQL
Device 音频：播放后删除，不进 MySQL
```

因此 V1 不创建：

```text
audio_files
audio_assets
message_audio
```

未来如果需要服务端长期音频存储，再进入 V2 媒体资产系统设计。

---

# V1 Auth 数据库边界

v1.5.7 正式确认：普通用户只支持邮箱验证码注册，验证码不进入 MySQL。

```text
验证码：Redis，默认 TTL 5 分钟
用户账号：users 表
管理员账号：后端环境变量，不进入 users 表
```

`users` 表新增 / 保留：

```text
email_verified_at
```

V1 不创建：

```text
email_verification_codes
admin_users
roles
permissions
auth_events
```

这些能力留给 V2。

---

# V1 Agent Tokens 成本控制边界

v1.5.8 正式确认：V1 使用 Agent Tokens 作为平台余额单位。

```text
1 RMB = 1000 Agent Tokens
平台扣费 = 真实成本 × 1.5
```

数据库保持轻量，不新增订单、支付、发票、交易流水表。

`usage_records.cost_tokens` 表示最终扣除的 Agent Tokens。

新增 / 建议字段：

```text
raw_cost_cny
billing_multiplier
pricing_snapshot
```

V1 不创建：

```text
orders
payments
invoices
balance_transactions
billing_rules
```

如后续接入真实支付，再进入 V2 Billing System。


---

# v1.5.9 Update: Lightweight Recharge Orders

V1 新增两张账务基础表：

```text
recharge_orders
agent_token_transactions
```

数据库核心表从 13 张扩展为 15 张。

新增原则：

```text
recharge_orders 记录充值订单。
usage_records 记录模型 / 语音消费明细。
agent_token_transactions 记录余额变化流水。
users.balance_tokens 只是当前余额快照。
```

V1 不接真实支付，但保留 `payment_provider`、`payment_method`、`payment_trade_no`、`payment_payload` 字段，便于未来接入微信 / 支付宝。


---

# v1.5.10 Update：Admin Manual Token Adjustment

V1 增强 `agent_token_transactions`，用于支持管理员手动增加 Agent Tokens。

数据库核心表数量不增加，仍保持 v1.5.9 的 15 张核心表，但 `agent_token_transactions` 增加管理员审计字段：

```text
operator_admin_id
```

管理员手动充值不创建 `recharge_orders`。
