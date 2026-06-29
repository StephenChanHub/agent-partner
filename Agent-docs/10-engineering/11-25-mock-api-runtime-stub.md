# Backend Mock API + Runtime Stub v1.6

## 1. 工程目标

v1.6 是后端骨架的第一次“可联调版本”。

目标：

```text
所有 P0 / P1 核心接口都有 Controller
所有接口返回稳定 JSON
所有第三方服务通过 Mock Adapter 占位
所有真实 Provider 只需要填环境变量切换
```

## 2. 模块范围

### AuthModule

Mock 支持：

```text
POST /auth/email-code/send
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

V1 邮箱验证码：Redis / memory cache，默认 mock code = `123456`。

### AgentsModule

Mock 支持：

```text
GET /agents
GET /agents/:slug
```

返回 Agent Manifest：

```text
identity
social.galleryImages
galleryVideos
model.profileId
voice.profileId
config.prompt
```

### RuntimeModule

Mock 支持：

```text
POST /chat
POST /voice
GET /runtime/audio/temp/:audioId
```

### BillingModule

Mock 支持：

```text
GET /billing/pricing
GET /billing/packages
POST /billing/recharge-orders
POST /billing/recharge-orders/:id/mock-pay
GET /billing/transactions
POST /studio/users/:id/tokens/adjust
```

### Studio Modules

Mock 支持：

```text
/studio/agents
/studio/model-profiles
/studio/voice-profiles
/studio/users
```

## 3. Mock Data 原则

Mock 数据应集中管理，不散落在 Controller 中。

推荐路径：

```text
13-backend-skeleton/src/mock/mock-data.ts
```

包含：

```text
mockUser
mockAdmin
mockAgents
mockModelProfiles
mockVoiceProfiles
mockSessions
mockRechargePackages
```

## 4. Runtime Service 最小职责

`RuntimeService` 在 v1.6 中至少实现：

```text
handleTextChat()
handleVoiceChat()
handleEvent()
```

其中：

```text
handleTextChat = Mock LLM + Usage + Messages
handleVoiceChat = Mock STT + handleTextChat + Mock TTS + Temp Audio
```

## 5. 文件上传策略

v1.6 `/voice` 可以接受两种方式：

```text
multipart/form-data audio file
application/json mockText
```

这样前端可以先不做录音上传，直接用 `mockText` 联调。

## 6. 真实 Provider 接入策略

### DeepSeek

`DeepSeekLLMAdapter` 先预留：

```text
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
```

如果没有 key，禁止真实调用，自动使用 Mock。

### ElevenLabs

`ElevenLabsTTSAdapter` 先预留：

```text
ELEVENLABS_API_KEY
ELEVENLABS_DEFAULT_MODEL_ID
ELEVENLABS_DEFAULT_OUTPUT_FORMAT
```

VoiceProfile 提供：

```text
voiceId
modelId
outputFormat
```

## 7. v1.6 交付清单

```text
API 文档更新
openapi.yaml 版本更新
Runtime Stub 文档
Mock API Runbook
后端骨架新增 RuntimeChatController
后端骨架新增 DeepSeekLLMAdapter
后端骨架新增 mock data
.env.example 更新 Provider 配置
```
