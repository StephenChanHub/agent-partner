# Agent Config & Media Schema v1.5.5

## 1. 目标

本设计用于支持 V1 的轻量 Agent 配置：

```text
Agent Config Prompt
Agent 图片墙
Agent 视频墙
```

全部放在 `agent_versions.manifest` JSON 中。

## 2. Manifest 中的 Config

```json
{
  "config": {
    "prompt": "你是 Jarvis，一名可靠、专业、清晰的个人 AI 助手。"
  }
}
```

`config.prompt` 保存：

```text
人格
职业
能力
回答风格
边界
专属规则
```

## 3. Manifest 中的 Social

```json
{
  "social": {
    "galleryImages": [
      {
        "url": "/uploads/agents/jarvis/images/001.png",
        "alt": "Jarvis profile photo",
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
  }
}
```

## 4. 为什么不建 agent_media 表

V1 只展示路径，不做媒体资产管理。

因此不需要：

```text
上传记录
审核状态
转码状态
媒体尺寸
CDN 状态
多分辨率
```

V2 如果要做完整媒体库，再拆表。

## 5. 校验规则

Studio 保存 Manifest 时应校验：

```text
identity.name 必填
identity.slug 必填
model.profileId 必填
voice.profileId 可选，但语音 Agent 推荐必填
config.prompt 必填
galleryImages[].url 必须是字符串
galleryVideos[].url 必须是字符串
galleryVideos[].posterUrl 可选
sortOrder 可选，默认按数组顺序展示
```

## 6. API 返回

Dashboard 获取 Agent 详情时，应返回：

```json
{
  "id": "agt_xxx",
  "slug": "jarvis",
  "name": "Jarvis",
  "description": "Personal AI Assistant",
  "avatarUrl": "/uploads/agents/jarvis/avatar.png",
  "social": {
    "galleryImages": [],
    "galleryVideos": []
  }
}
```
