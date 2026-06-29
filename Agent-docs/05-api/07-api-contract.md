# 07. Jarvis API Contract v1.5.7

## 1. 文档目的

本文档定义 Jarvis Platform V1 的 API 总契约。

v1.5.7 之后，V1 API 范围正式收敛为：

```text
邮箱验证码注册 / 登录
Agent 列表和详情
Agent Session
文字聊天
语音聊天
设备绑定与语音终端
Studio Agent 管理
Model Library
Voice Library
Usage / Billing Foundation
```

V1 不实现：

```text
Skill Library API
真实工具调用 API
Robot Action 实际执行 API
复杂媒体库 API
支付订单 API
```

## 2. API 设计原则

### 2.1 API Layer 不写业务逻辑

Controller 只负责：

```text
认证
参数校验
请求解析
调用 Application / Runtime
返回统一响应
```

### 2.2 Dashboard 使用 User JWT

```http
Authorization: Bearer <access_token>
```

### 2.3 Device 使用 Device Token

```http
Authorization: Device <device_token>
```

### 2.4 文本聊天使用 SSE

V1 文本聊天推荐 SSE Streaming。

### 2.5 语音聊天是回合制

V1 语音聊天不是实时电话，而是：

```text
用户说一句
↓
STT 转文本
↓
LLM 生成文本
↓
TTS 生成音频
↓
返回用户
```


### 2.6 V1 认证方式

普通用户只支持邮箱验证码注册。

```text
POST /auth/email-code/send
POST /auth/register
POST /auth/login
```

管理员账号 V1 只有一个，来自后端环境变量。管理员不通过注册创建。

## 3. V1 Agent API 返回结构

Agent 详情必须包含：

```json
{
  "id": "agt_xxx",
  "slug": "coding-mentor",
  "name": "Coding Mentor",
  "description": "A senior engineering mentor.",
  "avatarUrl": "/uploads/agents/coding/avatar.png",
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
  "capabilities": {
    "chat": true,
    "voice": true,
    "tools": []
  }
}
```

`tools` V1 固定为空数组或仅展示未来能力，不触发真实工具调用。

## 4. V1 Studio Agent Draft Manifest

Studio 保存 Agent Draft 时，Manifest 使用：

```json
{
  "identity": {},
  "social": {},
  "model": {},
  "voice": {},
  "config": {},
  "runtime": {}
}
```

不再使用：

```json
{
  "personality": {},
  "skills": [],
  "permissions": []
}
```

## 5. API 模块清单

```text
Auth API
Agent API
Agent Session / Message API
Runtime Chat API
Device API
Studio Agent API
Studio Model Profile API
Studio Voice Profile API
Usage API
```

## 6. V2 API 预留

以下 API 保留为 V2：

```text
Studio Skill Library API
Robot Action API
Tool Invocation API
Media Asset API
Payment API
```


## v1.6 Core Mock API

v1.6 将 API Contract 的核心接口提升为 Mock 可联调状态。

优先级：

```text
P0：Auth / Agents / Agent Sessions / Chat / Voice / Billing
P1：Studio Agent / Model / Voice / User / Tokens
P2：Device 基础连接与 Voice Turn
```

真实 DeepSeek 与 ElevenLabs 不在 v1.6 强制接入；后端只预留 Adapter 和环境变量，默认 Mock。
