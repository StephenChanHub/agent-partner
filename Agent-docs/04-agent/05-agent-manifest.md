# Agent Manifest Specification v1.5.5

## 1. Manifest 定位

Agent Manifest 是 Studio 发布 Agent 时生成的版本化配置。

v1.5.5 对 Manifest 做一次 V1 轻量化收敛：

```text
V1 不再拆 Persona / Capability / Tool / Behavior 多套配置。
V1 将它们统一为一段 config.prompt。
```

因此，V1 的 Agent Manifest 核心结构是：

```text
identity + social + model + voice + config + runtime
```

## 2. V1 Agent 的产品定义

V1 中，一个 Agent 是：

```text
一个由管理员配置好的数字人
```

它包含：

```text
基础信息：叫什么、怎么介绍自己、头像是什么
社交展示：照片墙、视频墙
大脑：选择哪个 Model Profile
声音：选择哪个 Voice Profile
配置提示词：这个 Agent 是谁、擅长什么、怎么说话、不能做什么
运行策略：V1 使用轻量上下文和会话摘要
```

## 3. 顶层结构

```json
{
  "schemaVersion": "1.5.5",
  "identity": {},
  "social": {},
  "model": {},
  "voice": {},
  "config": {},
  "runtime": {}
}
```

V1 不再包含：

```json
{
  "personality": {},
  "skills": [],
  "permissions": [],
  "behaviorPolicy": {}
}
```

这些内容全部先写入 `config.prompt`。

## 4. Identity

```json
{
  "identity": {
    "name": "Coding Mentor",
    "slug": "coding-mentor",
    "description": "A senior engineering mentor for software architecture.",
    "avatarUrl": "/uploads/agents/coding/avatar.png",
    "category": "coding"
  }
}
```

字段说明：

| 字段 | 说明 |
|---|---|
| name | Agent 展示名称 |
| slug | URL / 业务唯一标识 |
| description | 展示页简介 |
| avatarUrl | 头像路径 |
| category | 可选分类 |

## 5. Social Gallery

Agent 像一个人，需要自己的展示内容。

V1 新增：

```json
{
  "social": {
    "galleryImages": [
      {
        "url": "/uploads/agents/coding/images/workspace.png",
        "alt": "Coding Mentor workspace",
        "sortOrder": 1
      }
    ],
    "galleryVideos": [
      {
        "url": "/uploads/agents/coding/videos/intro.mp4",
        "posterUrl": "/uploads/agents/coding/videos/intro-cover.png",
        "title": "Meet Coding Mentor",
        "sortOrder": 1
      }
    ]
  }
}
```

### 5.1 galleryImages

图片数组，用于 Agent 详情页的照片墙。

| 字段 | 说明 |
|---|---|
| url | 图片路径或 CDN URL |
| alt | 图片替代文本 |
| sortOrder | 展示排序 |

### 5.2 galleryVideos

视频数组，用于 Agent 详情页的视频墙。

| 字段 | 说明 |
|---|---|
| url | 视频路径或 CDN URL |
| posterUrl | 视频封面图 |
| title | 视频标题 |
| sortOrder | 展示排序 |

V1 只保存路径，不做上传、转码、审核、CDN 管理。V2 再考虑 `agent_media` 表。

## 6. Model

```json
{
  "model": {
    "profileId": "model_profile_gemini_flash_default",
    "runtimeOverrides": {
      "temperature": 0.7,
      "maxOutputTokens": 4096
    }
  }
}
```

`profileId` 指向 Studio Model Library 的 `model_profiles`。

Manifest 禁止保存 API Key。

## 7. Voice

```json
{
  "voice": {
    "profileId": "voice_profile_jarvis_male",
    "runtimeOverrides": {
      "speed": 1.0,
      "stability": 0.6,
      "similarityBoost": 0.75
    }
  }
}
```

`profileId` 指向 Studio Voice Library 的 `voice_profiles`。

Manifest 不直接保存 ElevenLabs API Key。

V1 推荐：

```text
平台级 ELEVENLABS_API_KEY 放在 .env
voice_profiles 保存 voiceId / modelId / outputFormat / 默认参数
Agent Manifest 保存 voice.profileId
```

## 8. Config Prompt

这是 v1.5.5 最重要的收敛。

```json
{
  "config": {
    "prompt": "你是 Coding Mentor，一名资深前端架构师。你冷静、直接、耐心，擅长 React、TypeScript、NestJS、Prisma 和 API 设计。回答时先给结论，再解释原因，最后给执行步骤。不要编造不存在的 API，不确定时要说明不确定。"
  }
}
```

V1 中，以下内容全部写入 `config.prompt`：

```text
Persona：人格
Capability：专业能力
Tool：能力描述，不是真实工具调用
Behavior：行为边界
Prompt：Agent 专属设定
```

## 9. Runtime

```json
{
  "runtime": {
    "memoryStrategy": "summary_recent_messages",
    "streaming": true,
    "voiceReply": true
  }
}
```

V1 Runtime 只需要支持：

```text
文字输入 → 大模型文本回复
语音输入 → STT → 大模型文本回复 → TTS → 音频回复
```

## 10. 完整示例

```json
{
  "schemaVersion": "1.5.5",
  "identity": {
    "name": "Coding Mentor",
    "slug": "coding-mentor",
    "description": "A senior engineering mentor for software architecture.",
    "avatarUrl": "/uploads/agents/coding/avatar.png",
    "category": "coding"
  },
  "social": {
    "galleryImages": [
      {
        "url": "/uploads/agents/coding/images/desk.png",
        "alt": "Coding Mentor workspace",
        "sortOrder": 1
      }
    ],
    "galleryVideos": [
      {
        "url": "/uploads/agents/coding/videos/intro.mp4",
        "posterUrl": "/uploads/agents/coding/videos/intro-cover.png",
        "title": "Meet Coding Mentor",
        "sortOrder": 1
      }
    ]
  },
  "model": {
    "profileId": "model_profile_gemini_flash_default",
    "runtimeOverrides": {
      "temperature": 0.7,
      "maxOutputTokens": 4096
    }
  },
  "voice": {
    "profileId": "voice_profile_jarvis_male",
    "runtimeOverrides": {
      "speed": 1.0,
      "stability": 0.6,
      "similarityBoost": 0.75
    }
  },
  "config": {
    "prompt": "你是 Coding Mentor，一名资深前端架构师。你冷静、直接、耐心，擅长 React、TypeScript、NestJS、Prisma 和 API 设计。回答时先给结论，再解释原因，最后给执行步骤。不要编造不存在的 API，不确定时要说明不确定。"
  },
  "runtime": {
    "memoryStrategy": "summary_recent_messages",
    "streaming": true,
    "voiceReply": true
  }
}
```

## 11. V2 升级方向

当 V2 真正需要工具调用、机器人控制、外部系统集成时，再把 `config.prompt` 中的能力拆为：

```text
Persona Profile
Capability Profile
Tool Skill
Behavior Policy
Permission
```

V1 不提前实现这些复杂资源库。
