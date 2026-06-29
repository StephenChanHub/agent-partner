# Studio Resource Library Model v1.5.5

## 1. 定位

Studio Resource Library 是管理员维护平台级可复用资源的地方。

V1 只保留两个资源库：

```text
Model Library
Voice Library
```

Skill Library 暂不进入 V1，实现放到 V2。

## 2. 为什么 V1 保留 Model Library

模型配置是平台级资源。

管理员需要支持：

```text
当前一个模型
未来多个 Gemini / DeepSeek / OpenAI / Claude
不同 Agent 选择不同模型
统一管理 API Key 和模型参数
```

所以 V1 必须保留 `model_profiles`。

## 3. 为什么 V1 保留 Voice Library

音色配置也是平台级资源。

管理员需要支持：

```text
ElevenLabs 不同 voice_id
不同 Agent 选择不同音色
试听音色
统一管理模型 ID / 输出格式 / 默认语音参数
```

所以 V1 必须保留 `voice_profiles`。

## 4. 为什么 V1 不做 Skill Library

V1 只做文字聊天和语音聊天，不做真实工具调用。

Persona、Capability、Behavior 在 V1 本质上都会变成一段提示词。

因此 V1 统一使用：

```text
Agent Manifest config.prompt
```

而不是：

```text
skill_profiles
persona_profiles
capability_profiles
behavior_policies
```

## 5. V1 Agent 资源引用关系

```text
Agent Version Manifest
├── model.profileId  → model_profiles
├── voice.profileId  → voice_profiles
├── config.prompt    → Agent 专属配置提示词
└── social           → Agent 展示图片 / 视频
```

## 6. V2 再恢复 Skill Library

当 Jarvis 进入工具调用和机器人控制阶段，再升级：

```text
Skill Library
Tool Permission
Behavior Policy
Function Calling Schema
Robot Capability
```

这时可以重新启用 `skill_profiles` 或拆分为更清晰的多张表。
