# Jarvis V1 Core Mock API v1.6

## 1. 文档目标

v1.6 的 API 目标是：**核心功能 API 先可联调，真实第三方服务后接入。**

也就是说：

```text
前端可以开发
设备端可以开发
Studio 可以开发
后端 Runtime 可以跑通 Stub
DeepSeek / ElevenLabs / 支付接口暂时用 Mock
```

## 2. Provider 策略

### 2.1 大模型 API

V1 初期模型确定为 DeepSeek API，但 v1.6 默认不强制真实调用。

```text
LLM_PROVIDER=mock      默认
LLM_PROVIDER=deepseek  后续填入 Key 后启用
```

相关环境变量：

```env
LLM_PROVIDER=mock
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

Mock 阶段返回固定结构：

```json
{
  "content": "Mock response: ...",
  "provider": "mock",
  "model": "mock-llm",
  "usage": {
    "inputTokens": 1000,
    "outputTokens": 200,
    "totalTokens": 1200
  }
}
```

### 2.2 ElevenLabs API

v1.6 默认不真实调用 ElevenLabs。

```text
TTS_PROVIDER=mock         默认
TTS_PROVIDER=elevenlabs   后续填入 Key 后启用
```

相关环境变量：

```env
TTS_PROVIDER=mock
ELEVENLABS_API_KEY=
ELEVENLABS_DEFAULT_MODEL_ID=eleven_v3
ELEVENLABS_DEFAULT_OUTPUT_FORMAT=mp3_44100_128
```

Mock 阶段生成临时音频 URL：

```json
{
  "audio": {
    "tempUrl": "/runtime/audio/temp/mock-audio-001.mp3",
    "mimeType": "audio/mpeg",
    "storagePolicy": "CLIENT_CACHE_OPTIONAL",
    "expiresIn": 600
  }
}
```

## 3. 核心 API 优先级

### P0：必须先 Mock 可用

```text
POST /auth/email-code/send
POST /auth/register
POST /auth/login
GET  /me
GET  /agents
GET  /agents/{slug}
GET  /agent-sessions/current
POST /agent-sessions
GET  /agent-sessions/{sessionId}/messages
POST /chat
POST /voice
GET  /runtime/audio/temp/{audioId}
GET  /billing/packages
GET  /billing/pricing
GET  /billing/transactions
GET  /billing/recharge-orders
POST /billing/recharge-orders
POST /billing/recharge-orders/{id}/mock-pay
```

### P1：Studio 管理端核心

```text
GET  /studio/agents
POST /studio/agents
PATCH /studio/agents/{agentId}
POST /studio/agents/{agentId}/publish
GET  /studio/model-profiles
POST /studio/model-profiles
POST /studio/model-profiles/{id}/test
GET  /studio/voice-profiles
POST /studio/voice-profiles
POST /studio/voice-profiles/{id}/test
POST /studio/users/{id}/tokens/adjust
```

### P2：设备端基础

```text
POST /devices/pairing-code
POST /devices/bind
POST /devices/connect
POST /devices/heartbeat
POST /voice
```

V1 设备端不存语音文件，播放后删除。

## 4. POST /chat

文字聊天接口。

### Request

```json
{
  "agentSlug": "jarvis",
  "sessionId": "session_mock_jarvis",
  "message": "你好，Jarvis",
  "client": "web"
}
```

### Mock Response

```json
{
  "sessionId": "session_mock_jarvis",
  "userMessage": {
    "id": "msg_user_mock_001",
    "role": "user",
    "content": "你好，Jarvis",
    "inputMode": "text"
  },
  "assistantMessage": {
    "id": "msg_assistant_mock_001",
    "role": "assistant",
    "content": "Mock response: 你好，Jarvis",
    "responseMode": "text"
  },
  "usage": {
    "inputTokens": 1000,
    "outputTokens": 200,
    "totalTokens": 1200,
    "costAgentTokens": 3
  }
}
```

## 5. POST /voice

语音聊天接口。V1 本质仍然是回合制：

```text
语音 → STT → LLM → TTS → 播放
```

### Request

`multipart/form-data`

```text
audio: file
agentSlug: jarvis
sessionId: session_mock_jarvis
client: web | device
```

Mock 阶段可以允许 JSON 代替音频文件：

```json
{
  "mockText": "今天天气怎么样？",
  "agentSlug": "jarvis",
  "sessionId": "session_mock_jarvis",
  "client": "web"
}
```

### Mock Response

```json
{
  "sessionId": "session_mock_jarvis",
  "transcript": "今天天气怎么样？",
  "userMessage": {
    "id": "msg_user_voice_mock_001",
    "role": "user",
    "content": "今天天气怎么样？",
    "inputMode": "voice"
  },
  "assistantMessage": {
    "id": "msg_assistant_voice_mock_001",
    "role": "assistant",
    "content": "Mock response: 今天天气晴。",
    "responseMode": "voice"
  },
  "audio": {
    "messageId": "msg_assistant_voice_mock_001",
    "tempUrl": "/runtime/audio/temp/mock-audio-001.mp3",
    "mimeType": "audio/mpeg",
    "storagePolicy": "CLIENT_CACHE_OPTIONAL",
    "expiresIn": 600
  },
  "usage": {
    "inputTokens": 1000,
    "outputTokens": 200,
    "ttsCharacters": 18,
    "costAgentTokens": 13
  }
}
```

## 6. 语音缓存规则

Web：

```text
收到 audio.tempUrl
↓
下载 Blob
↓
以 assistantMessage.id 为 key 存 IndexedDB
```

Device：

```text
下载 / 接收音频
↓
播放
↓
删除本地临时文件
```

Core：

```text
只保存临时音频，默认 10 分钟过期
不长期保存历史语音
```

## 7. Billing Mock

V1 使用 Agent Tokens：

```text
1000 Agent Tokens = 1 RMB
真实成本 × 1.5 = 平台扣费
```

Mock 阶段可返回固定用量，但 Response 必须保留真实字段：

```json
{
  "usage": {
    "inputTokens": 1000,
    "outputTokens": 200,
    "ttsCharacters": 18,
    "costAgentTokens": 13,
    "pricingSnapshot": {
      "billingMultiplier": 1.5,
      "agentTokensPerRmb": 1000
    }
  }
}
```

## 8. v1.6 验收标准

```text
1. 前端可以调用 /auth/register 和 /auth/login。
2. 前端可以渲染 /agents。
3. 前端可以调用 /chat 并显示 Mock 回复。
4. 前端可以调用 /voice 并拿到 transcript + assistant text + temp audio。
5. 前端可以用 messageId 保存 IndexedDB 音频。
6. Studio 可以 CRUD Agent / Model / Voice 的 Mock 数据。
7. Billing 可以创建订单、Mock 支付、查看流水。
8. 管理员可以手动增加用户 Agent Tokens。
9. DeepSeek 和 ElevenLabs 只需填 Key 即可切换 Adapter。
```
