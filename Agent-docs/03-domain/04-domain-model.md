# 04. 领域模型 v1.5.5

## 1. 当前领域边界

v1.5.5 对 V1 做了轻量化收敛。

Jarvis V1 的领域模型分为：

```text
Product Domain
├── User
├── Device
├── Agent
├── Agent Version
├── Agent Session
└── Message

Resource Library Domain
├── Model Profile
└── Voice Profile

Runtime Domain
├── Runtime Event
├── Intent Record
└── Action Record

Usage Domain
└── Usage Record
```

## 2. V1 产品范围

V1 只实现：

```text
网页文字聊天
网页语音聊天
硬件端语音聊天
长期 Agent Session
Model Library
Voice Library
Agent Config Prompt
Agent 照片 / 视频展示
基础 Usage 记录
```

V1 不实现：

```text
Skill Library
真实工具调用
Robot Action 实际执行
复杂 Persona / Capability / Behavior 拆分配置
Embedding Memory
向量数据库
复杂支付系统
```

## 3. Product Domain

### 3.1 User

用户身份对象。

保存：

- email
- password hash
- nickname
- role
- balance_tokens
- used_tokens
- current_session_id
- last_seen_at

User 不保存 Prompt，不保存 API Key，不保存设备 Token 明文。

### 3.2 Device

设备身份对象。

V1 设备主要是树莓派语音终端或其他硬件语音终端。

Device 保存：

- device_sn
- token_hash
- owner user_id
- device_type
- capabilities
- status
- last_seen_at

设备只负责听、说、上报状态。大模型、语音合成、上下文、会话都在 Core。

### 3.3 Agent

平台级 AI 产品。

Agent 不属于某个用户。Agent 由 Studio 创建和发布。

V1 Agent 的本质是：

```text
Model Profile + Voice Profile + Config Prompt + Social Gallery
```

Agent 表只保存：

- slug
- status
- published_version_id

具体配置都在 Agent Version 的 Manifest 中。

### 3.4 Agent Version

Agent 的版本化 Manifest。

V1 Manifest 包含：

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
config.prompt = Persona + Capability + Behavior + Agent 专属设定
```

### 3.5 Agent Session

用户与某个 Agent 的长期使用空间。

```text
一个 User + 一个 Agent = 一个长期 Agent Session
```

V1 不做 New Chat。

Agent Session 维护：

- summary
- summary_updated_at
- message_count
- last_message_at

用于解决长会话上下文过长和 Agent 失忆问题。

### 3.6 Message

聊天消息。

Message 只保存真正的对话内容。

V1：

```text
文字聊天消息 → 保存
语音转写后的用户消息 → 保存
大模型文本回复 → 保存
ElevenLabs 音频可以只保存临时 URL 或 metadata
```

动作指令、设备心跳、系统事件不进入 Message。

## 4. Resource Library Domain

### 4.1 Model Profile

管理员维护的大模型配置。

Agent Manifest 只引用：

```text
model.profileId
```

Model Profile 保存：

- provider
- model_name
- base_url
- api_key_encrypted
- default_temperature
- default_max_tokens
- status

### 4.2 Voice Profile

管理员维护的音色配置。

Agent Manifest 只引用：

```text
voice.profileId
```

Voice Profile 保存：

- provider
- voice_id
- model_id
- output_format
- default_speed
- default_stability
- default_similarity_boost
- preview_audio_url
- status

V1 平台级 ElevenLabs API Key 放在环境变量或安全配置中，Agent Manifest 不保存密钥。

## 5. Runtime Domain

Runtime Domain 保留三张轻量审计表：

```text
Runtime Event
Intent Record
Action Record
```

V1 主要用于：

```text
记录文字输入事件
记录语音输入事件
记录 Chat Action
记录 Voice Action
记录错误和用量关联
```

Robot Action 结构保留为 V2 预留，但 V1 不实际执行机器人动作。

## 6. Usage Domain

Usage Record 记录每次成本相关调用。

V1 记录：

```text
LLM input tokens
LLM output tokens
STT seconds
TTS characters
cost tokens
```

它为未来商业化做基础，但 V1 不接支付系统。

## 7. V2 延后领域

以下对象不进入 V1 数据库：

```text
SkillProfile
PersonaProfile
CapabilityProfile
BehaviorPolicy
ToolSkill
AgentMedia
MemoryItem
Embedding
PaymentOrder
RobotMap
SensorFrame
```

V1 只把 Agent 跑起来，先完成聊天闭环。


---

# v1.5.10 Update：Admin Manual Token Adjustment

V1 正式支持管理员手动增加用户 Agent Tokens。该能力不创建充值订单，而是写入 `agent_token_transactions`：

```text
type = ADMIN_RECHARGE
direction = CREDIT
```

所有余额变化必须有流水，禁止只改 `users.balance_tokens`。
