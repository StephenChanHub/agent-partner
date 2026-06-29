# Studio Resource Library API v1.5.1

## 1. 目标

本 API 面向管理员端 Studio，用于维护平台级资源库：

```text
Model Library
Voice Library
```

所有接口需要 Admin 权限。

## 2. Model Profiles

### GET /studio/model-profiles

查询模型配置列表。

Query：

```text
provider?: GEMINI | DEEPSEEK | OPENAI | CLAUDE | CUSTOM
status?: ACTIVE | DISABLED | ARCHIVED
page?: number
pageSize?: number
```

Response：

```json
{
  "items": [
    {
      "id": "model_profile_xxx",
      "provider": "GEMINI",
      "displayName": "Gemini Flash Default",
      "modelName": "gemini-2.5-flash",
      "baseUrl": "https://generativelanguage.googleapis.com",
      "apiKeyMasked": "****abcd",
      "defaultTemperature": 0.7,
      "defaultMaxTokens": 4096,
      "status": "ACTIVE",
      "isDefault": true,
      "createdAt": "2026-06-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### POST /studio/model-profiles

创建模型配置。

Request：

```json
{
  "provider": "GEMINI",
  "displayName": "Gemini Flash Default",
  "modelName": "gemini-2.5-flash",
  "baseUrl": "https://generativelanguage.googleapis.com",
  "apiKey": "xxxx",
  "defaultTemperature": 0.7,
  "defaultMaxTokens": 4096,
  "defaultTimeoutMs": 30000,
  "isDefault": true
}
```

Response：

```json
{
  "id": "model_profile_xxx",
  "provider": "GEMINI",
  "displayName": "Gemini Flash Default",
  "modelName": "gemini-2.5-flash",
  "apiKeyMasked": "****abcd",
  "status": "ACTIVE"
}
```

注意：`apiKey` 只允许在创建和主动更新时提交，响应永远不返回明文。

### GET /studio/model-profiles/:id

查询单个模型配置。

响应中只返回 `apiKeyMasked`，不返回 `apiKey` 或 `apiKeyEncrypted`。

### PATCH /studio/model-profiles/:id

更新模型配置。

可更新字段：

```json
{
  "displayName": "Gemini Flash Main",
  "baseUrl": "https://generativelanguage.googleapis.com",
  "apiKey": "new-key-optional",
  "defaultTemperature": 0.5,
  "defaultMaxTokens": 2048,
  "status": "ACTIVE"
}
```

如果不传 `apiKey`，保留原密钥。

### POST /studio/model-profiles/:id/test

测试模型连接。

Request：

```json
{
  "prompt": "Reply with OK."
}
```

Response：

```json
{
  "success": true,
  "latencyMs": 820,
  "sampleOutput": "OK"
}
```

### POST /studio/model-profiles/:id/set-default

设置默认模型配置。

同一时间只允许一个 `ModelProfile.isDefault = true`。

### DELETE /studio/model-profiles/:id

逻辑删除或归档。

推荐行为：

```text
如果未被任何 Agent 引用：ARCHIVED
如果已被 Agent 引用：返回 409，并提示先迁移 Agent
```

## 3. Voice Profiles

### GET /studio/voice-profiles

查询音色配置列表。

Query：

```text
provider?: ELEVENLABS | OPENAI | AZURE | LOCAL | CUSTOM
language?: string
status?: ACTIVE | DISABLED | ARCHIVED
page?: number
pageSize?: number
```

Response：

```json
{
  "items": [
    {
      "id": "voice_profile_xxx",
      "provider": "ELEVENLABS",
      "displayName": "Jarvis Male Voice",
      "voiceId": "21m00Tcm4TlvDq8ikWAM",
      "language": "en",
      "previewUrl": "https://cdn.example.com/voice-preview.mp3",
      "defaultSpeed": 1.0,
      "defaultStability": 0.6,
      "defaultSimilarityBoost": 0.75,
      "status": "ACTIVE",
      "isDefault": true
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### POST /studio/voice-profiles

创建音色配置。

Request：

```json
{
  "provider": "ELEVENLABS",
  "displayName": "Jarvis Male Voice",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "language": "en",
  "description": "Default Jarvis voice",
  "previewUrl": "https://cdn.example.com/voice-preview.mp3",
  "defaultSpeed": 1.0,
  "defaultStability": 0.6,
  "defaultSimilarityBoost": 0.75,
  "isDefault": true
}
```

### PATCH /studio/voice-profiles/:id

更新音色配置。

### POST /studio/voice-profiles/:id/test

生成试听音频。

Request：

```json
{
  "text": "Hello, I am Jarvis."
}
```

Response：

```json
{
  "success": true,
  "audioUrl": "https://cdn.example.com/tmp/preview.mp3",
  "latencyMs": 1200
}
```

### POST /studio/voice-profiles/:id/set-default

设置默认音色。

### POST /studio/voice-profiles/sync-elevenlabs

从 ElevenLabs 同步可用 Voice 列表。

Response：

```json
{
  "imported": 3,
  "updated": 5,
  "skipped": 2
}
```

### DELETE /studio/voice-profiles/:id

逻辑归档。

## 4. Agent API 影响

创建或更新 Agent Manifest 时，Studio 需要提交：

```json
{
  "manifest": {
    "model": {
      "profileId": "model_profile_xxx",
      "runtimeOverrides": {
        "temperature": 0.7
      }
    },
    "voice": {
      "profileId": "voice_profile_xxx",
      "runtimeOverrides": {
        "speed": 1.0
      }
    }
  }
}
```

发布前校验：

```text
model.profileId 存在且 ACTIVE
voice.profileId 存在且 ACTIVE，除非 Agent 禁用语音
当前管理员有权限使用这些 Profile
```

## 5. 错误码

```text
MODEL_PROFILE_NOT_FOUND
MODEL_PROFILE_DISABLED
MODEL_PROFILE_IN_USE
MODEL_PROFILE_TEST_FAILED
VOICE_PROFILE_NOT_FOUND
VOICE_PROFILE_DISABLED
VOICE_PROFILE_IN_USE
VOICE_PROFILE_TEST_FAILED
SECRET_ENCRYPTION_FAILED
SECRET_DECRYPTION_FAILED
```

## 6. 安全要求

- 响应永远不返回明文 API Key；
- `apiKeyEncrypted` 只存在数据库和服务端内部；
- 日志禁止打印 API Key；
- 普通用户端不可访问 Model Profile 和 Voice Profile 管理 API；
- Runtime 通过 Repository 获取解密后的配置，不从前端接收 Key。

---

## v1.5.5 修正

V1 Studio Resource Library API 只实现：

```text
Model Profile API
Voice Profile API
```

Skill Profile API 延后到 V2。
