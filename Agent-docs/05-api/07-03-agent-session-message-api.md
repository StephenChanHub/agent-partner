# 07-03. Agent Session & Message API

## 1. 模块职责

Agent Session 是 Jarvis 的长期聊天空间。

核心原则：

```text
一个用户 + 一个 Agent = 一个唯一 Agent Session
```

不再使用传统多 Conversation / New Chat 模式。

---

## 2. POST /agent-sessions

打开某个 Agent。

### Headers

```http
Authorization: Bearer <access_token>
```

### Request

```json
{
  "agentSlug": "jarvis"
}
```

### 行为

```text
1. 校验 Agent 是否存在且已发布
2. 查询 user_id + agent_id 是否已有 Agent Session
3. 如果已有，返回已有 Session
4. 如果没有，创建新 Session
5. 更新用户 currentSessionId
6. 返回 Session 与 Agent 摘要
```

### Response

```json
{
  "data": {
    "id": "ses_01",
    "agent": {
      "id": "agt_01",
      "slug": "jarvis",
      "name": "Jarvis",
      "avatarUrl": "/agents/jarvis.png",
      "version": "1.0.0"
    },
    "status": "ACTIVE",
    "lastMessageAt": null,
    "createdAt": "2026-06-27T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:00:00.000Z"
  },
  "requestId": "req_01"
}
```

---

## 3. GET /agent-sessions/current

获取当前用户正在使用的 Agent Session。

### Response

```json
{
  "data": {
    "id": "ses_01",
    "agent": {
      "id": "agt_01",
      "slug": "jarvis",
      "name": "Jarvis",
      "avatarUrl": "/agents/jarvis.png",
      "capabilities": {
        "chat": true,
        "voice": true,
        "robot": false
      }
    },
    "status": "ACTIVE",
    "lastMessageAt": "2026-06-27T10:20:00.000Z"
  },
  "requestId": "req_01"
}
```

如果用户还没有打开过任何 Agent：

```json
{
  "data": null,
  "requestId": "req_01"
}
```

---

## 4. GET /agent-sessions/{sessionId}

获取指定 Agent Session。

### Response

```json
{
  "data": {
    "id": "ses_01",
    "agent": {
      "id": "agt_01",
      "slug": "jarvis",
      "name": "Jarvis",
      "avatarUrl": "/agents/jarvis.png",
      "version": "1.0.0"
    },
    "status": "ACTIVE",
    "messageCount": 128,
    "lastMessageAt": "2026-06-27T10:20:00.000Z",
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-27T10:20:00.000Z"
  },
  "requestId": "req_01"
}
```

---

## 5. GET /agent-sessions/{sessionId}/messages

分页获取消息。

### Query

| 参数 | 类型 | 必填 | 说明 |
|---|---|:---:|---|
| cursor | string | 否 | 游标，通常为 messageId |
| limit | number | 否 | 默认 30，最大 100 |
| direction | string | 否 | `before` 或 `after`，默认 `before` |

### Response

```json
{
  "data": [
    {
      "id": "msg_01",
      "role": "USER",
      "content": "解释一下 TCP",
      "contentType": "TEXT",
      "metadata": null,
      "createdAt": "2026-06-27T10:00:00.000Z"
    },
    {
      "id": "msg_02",
      "role": "ASSISTANT",
      "content": "TCP 是一种面向连接的传输层协议...",
      "contentType": "TEXT",
      "metadata": {
        "runtimeEventId": "evt_01",
        "latencyMs": 1200
      },
      "createdAt": "2026-06-27T10:00:02.000Z"
    }
  ],
  "pageInfo": {
    "nextCursor": "msg_01",
    "hasNextPage": true
  },
  "requestId": "req_01"
}
```

---

## 6. Message Role

V1 使用：

```text
USER
ASSISTANT
SYSTEM
TOOL
ROBOT
```

说明：

| Role | 说明 |
|---|---|
| USER | 用户输入 |
| ASSISTANT | AI 回复 |
| SYSTEM | 系统事件摘要，不直接展示给用户也可以 |
| TOOL | 工具调用结果 |
| ROBOT | 机器人动作反馈，例如“已向前移动 80cm” |

---

## 7. Message Content Type

```text
TEXT
VOICE_TRANSCRIPT
ROBOT_ACTION
SYSTEM_EVENT
ERROR
```

---

## 8. PATCH /agent-sessions/{sessionId}/archive

归档 Agent Session。

V1 可以先不在 UI 开放，但 API 预留。

### Request

```json
{
  "reason": "user_archived"
}
```

### Response

```json
{
  "data": {
    "id": "ses_01",
    "status": "ARCHIVED",
    "archivedAt": "2026-06-27T10:30:00.000Z"
  },
  "requestId": "req_01"
}
```

---

## 9. 错误码

| Code | HTTP | 场景 |
|---|---:|---|
| NOT_FOUND | 404 | Session 不存在 |
| FORBIDDEN | 403 | 访问他人 Session |
| AGENT_NOT_PUBLISHED | 400 | Agent 未发布 |
| SESSION_ARCHIVED | 400 | Session 已归档 |
| CONFLICT | 409 | 唯一 Session 创建冲突，后端应重试查询 |
