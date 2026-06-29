# Studio Resource Library Modules v1.5.1

## 1. 后端模块新增

V1.5.1 在 NestJS 后端骨架中新增两个业务模块：

```text
modules/model-profiles
modules/voice-profiles
```

它们属于 Studio 管理能力，但建议作为独立模块存在，而不是塞进 `studio` module。

原因：Runtime 也需要读取这些 Profile。

## 2. 推荐目录

```text
src/modules/model-profiles/
├── model-profiles.module.ts
├── model-profiles.controller.ts
├── model-profiles.service.ts
├── dto/
│   ├── create-model-profile.dto.ts
│   ├── update-model-profile.dto.ts
│   └── test-model-profile.dto.ts
└── repositories/
    └── model-profile.repository.ts

src/modules/voice-profiles/
├── voice-profiles.module.ts
├── voice-profiles.controller.ts
├── voice-profiles.service.ts
├── dto/
│   ├── create-voice-profile.dto.ts
│   ├── update-voice-profile.dto.ts
│   └── test-voice-profile.dto.ts
└── repositories/
    └── voice-profile.repository.ts
```

## 3. 权限边界

Controller：

```text
/studio/model-profiles
/studio/voice-profiles
```

只允许 Admin 访问。

Runtime 内部读取 Profile 时不走 HTTP，而是通过 Service / Repository。

## 4. ModelProfileService 职责

```text
创建模型配置
加密 API Key
更新模型配置
测试连接
设置默认模型
禁用 / 归档模型
查询可用于 Agent 的模型
Runtime 解析模型配置
```

不负责：

```text
直接拼 Prompt
直接调用 Chat Runtime
直接处理用户消息
```

## 5. VoiceProfileService 职责

```text
创建音色配置
更新音色配置
试听音色
同步 ElevenLabs voices
设置默认音色
禁用 / 归档音色
查询可用于 Agent 的音色
Runtime 解析音色配置
```

不负责：

```text
播放音频
控制设备扬声器
保存聊天消息
```

## 6. SecretCryptoService

V1.5.1 建议新增基础设施服务：

```text
src/infrastructure/crypto/secret-crypto.service.ts
```

职责：

```text
encryptSecret(raw: string): string
decryptSecret(encrypted: string): string
maskSecret(rawOrEncrypted): string
```

ModelProfileService 使用它加密 API Key。

## 7. Runtime 读取方式

Chat Engine 不应该直接读 Prisma。

推荐：

```text
ChatEngine
↓
ModelProfileResolver
↓
ModelProfileRepository
↓
SecretCryptoService
↓
LLM Adapter
```

Voice Engine：

```text
VoiceEngine
↓
VoiceProfileResolver
↓
VoiceProfileRepository
↓
TTS Adapter
```

## 8. Provider Adapter 选择

```typescript
switch (profile.provider) {
  case 'GEMINI':
    return geminiAdapter.generate(input, resolvedProfile);
  case 'DEEPSEEK':
    return deepseekAdapter.generate(input, resolvedProfile);
}
```

这段逻辑属于 LLM Router，不属于 Agent Service。

## 9. Mock 策略

v1.6 Mock API 阶段：

- Model Profile test 返回 Mock 成功；
- Voice Profile test 返回 Mock audioUrl；
- Runtime 默认选择 `isDefault=true` 的模型和音色；
- 若 Manifest 中指定 profileId，则返回对应 Mock Profile。

## 10. 禁止事项

```text
禁止 Controller 解密 API Key
禁止 API 响应返回 apiKeyEncrypted
禁止 Runtime 从前端接收 API Key
禁止 Agent Manifest 保存 API Key
禁止业务模块直接 new Gemini SDK / ElevenLabs SDK
```
