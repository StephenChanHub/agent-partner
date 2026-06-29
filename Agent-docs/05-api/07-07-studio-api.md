# 07-07 Studio API v1.5.5

## 1. 定位

Studio API 供管理员创建、编辑、测试和发布 Agent。

v1.5.5 之后，V1 Agent Editor 简化为：

```text
Basic
Social
Brain
Voice
Config
Test
Publish
```

不再提供 V1 Skill Library / Persona Builder / Behavior Builder。

## 2. 创建 Agent Draft

```http
POST /studio/agents
```

请求：

```json
{
  "slug": "coding-mentor",
  "name": "Coding Mentor",
  "description": "A senior engineering mentor."
}
```

## 3. 保存 Agent Draft Manifest

```http
PATCH /studio/agents/:agentId/draft
```

请求：

```json
{
  "manifest": {
    "schemaVersion": "1.5.5",
    "identity": {
      "name": "Coding Mentor",
      "slug": "coding-mentor",
      "description": "A senior engineering mentor.",
      "avatarUrl": "/uploads/agents/coding/avatar.png"
    },
    "social": {
      "galleryImages": [],
      "galleryVideos": []
    },
    "model": {
      "profileId": "model_profile_gemini_flash_default"
    },
    "voice": {
      "profileId": "voice_profile_jarvis_male"
    },
    "config": {
      "prompt": "你是 Coding Mentor，一名资深前端架构师。"
    },
    "runtime": {
      "memoryStrategy": "summary_recent_messages",
      "voiceReply": true
    }
  }
}
```

## 4. 测试 Agent

```http
POST /studio/agents/:agentId/test
```

V1 测试范围：

```text
文字回复测试
语音回复测试
Model Profile 是否可用
Voice Profile 是否可用
config.prompt 是否为空
```

## 5. 发布 Agent

```http
POST /studio/agents/:agentId/publish
```

请求：

```json
{
  "version": "1.0.0",
  "releaseNote": "Initial release"
}
```

## 6. V1 禁止事项

Studio V1 不做：

```text
Skill Profile CRUD
Tool Skill Test
Robot Action Test
Persona / Capability / Behavior 多资源绑定
```
