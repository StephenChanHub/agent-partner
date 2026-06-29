# Resource Library Database Schema v1.5.1

## 1. 新增表

V1.5.1 新增两张平台级资源表：

```text
model_profiles
voice_profiles
```

它们用于支持 Studio 中的大模型库和音色库。

## 2. 为什么需要独立表

Agent Manifest 只适合描述 Agent 行为，不适合保存敏感配置。

因此，以下内容必须放在资源库表中：

```text
模型供应商
模型名称
API Endpoint
API Key 加密值
ElevenLabs Voice ID
音色默认参数
启用 / 禁用状态
默认资源标记
```

## 3. model_profiles

核心字段：

```text
id
provider
display_name
model_name
base_url
api_key_encrypted
api_key_last_four
default_temperature
default_max_tokens
default_timeout_ms
extra_config
status
is_default
created_by_id
created_at
updated_at
```

### 设计说明

`api_key_encrypted` 保存加密后的 API Key。

`api_key_last_four` 用于 Studio UI 展示 masked key：

```text
****abcd
```

`extra_config` 用于保存供应商差异化配置，例如：

```json
{
  "topP": 0.9,
  "safetySettings": {},
  "responseMimeType": "text/plain"
}
```

## 4. voice_profiles

核心字段：

```text
id
provider
display_name
voice_id
language
description
preview_audio_url
default_speed
default_stability
default_similarity_boost
extra_config
status
is_default
created_by_id
created_at
updated_at
```

`extra_config` 可以保存 ElevenLabs 特有字段：

```json
{
  "style": 0.2,
  "useSpeakerBoost": true
}
```

## 5. 是否需要外键关联 Agent

V1.5.1 不在数据库层建立：

```text
AgentVersion -> ModelProfile
AgentVersion -> VoiceProfile
```

原因是 Agent Manifest 存储在 JSON 中，Profile 引用属于 Manifest 内容。

Runtime 通过 `model.profileId`、`voice.profileId` 解析资源，并在发布前进行应用层校验。

## 6. 删除策略

不做物理删除。

```text
ACTIVE
DISABLED
ARCHIVED
```

如果 Profile 已被 Agent 引用：

- 不允许直接归档，除非提供迁移策略；
- 可以先 DISABLED，阻止新 Agent 使用；
- Runtime 对已发布 Agent 的处理由策略决定。

## 7. 默认资源

同一类资源建议只有一个默认值：

```text
ModelProfile.isDefault = true
VoiceProfile.isDefault = true
```

服务层需要保证同类资源只有一个默认值。

## 8. Migration 策略

从 v1.5 升级到 v1.5.1：

```bash
npx prisma migrate dev --name add_studio_resource_libraries
```

生产环境：

```bash
npx prisma migrate deploy
```

## 9. 回滚注意

因为 Agent Manifest 将开始引用 `model.profileId` 和 `voice.profileId`，回滚数据库前必须先确认没有已发布 Agent 依赖新字段。

---

## v1.5.5 修正

V1 Studio Resource Library 只包含：

```text
model_profiles
voice_profiles
```

Skill Library 不进入 V1，相关设计移至 V2。
