# 07-02 Agent API v1.5.5

## 1. 定位

Agent API 供 Dashboard 用户查看可用 Agent、进入详情页、选择 Agent 开始会话。

V1 Agent 是：

```text
基础信息 + 社交展示 + 可聊天 + 可语音回复
```

用户不能修改 Agent。

## 2. GET /agents

返回已发布 Agent 列表。

响应示例：

```json
{
  "items": [
    {
      "id": "agt_jarvis",
      "slug": "jarvis",
      "name": "Jarvis",
      "description": "Your personal AI companion.",
      "avatarUrl": "/uploads/agents/jarvis/avatar.png",
      "status": "PUBLISHED",
      "version": "1.0.0",
      "capabilities": {
        "chat": true,
        "voice": true,
        "tools": []
      }
    }
  ]
}
```

## 3. GET /agents/:slug

返回 Agent 详情，包含照片墙和视频墙。

响应示例：

```json
{
  "id": "agt_jarvis",
  "slug": "jarvis",
  "name": "Jarvis",
  "description": "Your personal AI companion.",
  "avatarUrl": "/uploads/agents/jarvis/avatar.png",
  "social": {
    "galleryImages": [
      {
        "url": "/uploads/agents/jarvis/images/001.png",
        "alt": "Jarvis profile image",
        "sortOrder": 1
      }
    ],
    "galleryVideos": [
      {
        "url": "/uploads/agents/jarvis/videos/intro.mp4",
        "posterUrl": "/uploads/agents/jarvis/videos/intro-cover.png",
        "title": "Meet Jarvis",
        "sortOrder": 1
      }
    ]
  },
  "capabilities": {
    "chat": true,
    "voice": true,
    "tools": []
  }
}
```

## 4. 注意

Agent API 不返回：

```text
config.prompt
modelProfile API Key
voice provider secret
Agent 内部规则全文
```

这些只给 Runtime 和 Studio 使用。
