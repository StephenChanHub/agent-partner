# 07-04. Runtime / Chat / Voice API

## 1. 模块职责

Runtime API 是 Jarvis Core 的执行入口。

它不只是聊天接口，而是所有用户输入进入 Runtime Event Pipeline 的入口。

```text
Text Input
Voice Input
Dashboard Action
Device Event
↓
Runtime Event
↓
Intent Engine
↓
Task Dispatcher
├── Chat Engine
├── Robot Engine
├── System Engine
└── Skill Engine
```

---

## 2. POST /chat

Dashboard 文本聊天接口。

### Headers

```http
Authorization: Bearer <access_token>
Accept: text/event-stream
```

### Request

```json
{
  "agentSessionId": "ses_01",
  "content": "解释一下 TCP",
  "clientMessageId": "local_msg_001"
}
```

### 行为

```text
1. 保存 USER Message
2. 构造 Runtime Event
3. Intent Engine 判断类型
4. 如果是 CHAT，进入 Chat Engine
5. SSE 流式返回 token
6. 保存 ASSISTANT Message
7. 推送 WebSocket message.created
```

---

## 3. Chat SSE Events

### event: message.created

用户消息已保存。

```text
event: message.created
data: {"messageId":"msg_user_01","role":"USER"}
```

### event: token

模型流式输出。

```text
event: token
data: {"content":"TCP"}
```

### event: tool_call

如果 Runtime 调用了 Skill。

```text
event: tool_call
data: {"tool":"weather","status":"STARTED"}
```

### event: robot_command

如果文本输入被识别为 Robot Intent，返回命令已接收，而不是 token。

```text
event: robot_command
data: {"commandId":"cmd_01","type":"MOVE","status":"QUEUED"}
```

### event: done

完成。

```text
event: done
data: {"messageId":"msg_assistant_01","finishReason":"STOP"}
```

### event: error

错误。

```text
event: error
data: {"code":"INTERNAL_ERROR","message":"Runtime failed."}
```

---

## 4. POST /voice

设备上传语音。

### Headers

```http
Authorization: Device <device_token>
```

### Content-Type

```http
multipart/form-data
```

### Form Fields

| 字段 | 类型 | 必填 | 说明 |
|---|---|:---:|---|
| audio | file | 是 | 录音文件 |
| agentSessionId | string | 否 | 不传则使用用户 currentSessionId |
| format | string | 否 | wav / mp3 / webm |
| sampleRate | number | 否 | 采样率 |

### Response：Chat Intent

```json
{
  "data": {
    "runtimeEventId": "evt_01",
    "intent": "CHAT",
    "transcript": "解释一下 TCP",
    "messageId": "msg_02",
    "reply": {
      "text": "TCP 是一种面向连接的传输层协议...",
      "audioUrl": "/api/v1/audio/tts_01.mp3"
    }
  },
  "requestId": "req_01"
}
```

### Response：Robot Intent

```json
{
  "data": {
    "runtimeEventId": "evt_02",
    "intent": "ROBOT_MOVE",
    "transcript": "Jarvis，向前走两步",
    "command": {
      "commandId": "cmd_01",
      "type": "MOVE",
      "status": "QUEUED"
    },
    "reply": {
      "text": "好的，我向前移动。",
      "audioUrl": "/api/v1/audio/tts_02.mp3"
    }
  },
  "requestId": "req_02"
}
```


---

## 4.1 V1 Voice Audio Storage Policy

V1 语音接口必须明确区分文字历史和音频缓存。

```text
Core 保存文字消息。
Core 不长期保存音频。
Core 返回短期 tempAudioUrl。
Web 下载后保存到 IndexedDB。
Device 播放后删除。
```

### Response：Web Voice Chat

```json
{
  "data": {
    "runtimeEventId": "evt_01",
    "intent": "CHAT",
    "transcript": "今天天气怎么样？",
    "userMessage": {
      "id": "msg_user_01",
      "content": "今天天气怎么样？"
    },
    "assistantMessage": {
      "id": "msg_assistant_01",
      "content": "今天天气晴。",
      "metadata": {
        "audio": {
          "generated": true,
          "storage": "client_indexeddb",
          "cacheKey": "msg_assistant_01"
        }
      }
    },
    "audio": {
      "messageId": "msg_assistant_01",
      "tempUrl": "/api/v1/runtime/audio/temp/aud_01.mp3",
      "mimeType": "audio/mpeg",
      "storagePolicy": "CLIENT_PERSISTENT_INDEXEDDB",
      "expiresIn": 600
    }
  },
  "requestId": "req_01"
}
```

### Response：Device Voice Turn

```json
{
  "data": {
    "runtimeEventId": "evt_02",
    "intent": "CHAT",
    "transcript": "今天天气怎么样？",
    "assistantMessage": {
      "id": "msg_assistant_02",
      "content": "今天天气晴。"
    },
    "audio": {
      "messageId": "msg_assistant_02",
      "tempUrl": "/api/v1/runtime/audio/temp/aud_02.mp3",
      "mimeType": "audio/mpeg",
      "storagePolicy": "PLAY_AND_DISCARD",
      "expiresIn": 600
    }
  },
  "requestId": "req_02"
}
```

### GET /runtime/audio/temp/:audioId

获取 Core 短期音频中转文件。

```http
GET /api/v1/runtime/audio/temp/aud_01
Authorization: Bearer <token>
```

Response:

```http
200 OK
Content-Type: audio/mpeg
Cache-Control: private, max-age=600
```

说明：

```text
该接口返回的音频不是长期资源。
过期后返回 404 或 AUDIO_EXPIRED。
```

---

## 5. POST /runtime/events

内部或高级客户端提交 Runtime Event。

V1 可以不公开给普通前端，主要用于后续系统扩展。

### Request

```json
{
  "source": "dashboard",
  "type": "USER_COMMAND",
  "agentSessionId": "ses_01",
  "payload": {
    "text": "Jarvis，停下"
  }
}
```

### Response

```json
{
  "data": {
    "runtimeEventId": "evt_01",
    "intent": "ROBOT_STOP",
    "status": "DISPATCHED"
  },
  "requestId": "req_01"
}
```

---

## 6. Intent 类型

V1 / V2 预留：

```text
CHAT
ROBOT_MOVE
ROBOT_TURN
ROBOT_STOP
SYSTEM_STATUS
SYSTEM_BATTERY
DEVICE_CONTROL
UNKNOWN
```

---

## 7. Runtime Event 标准结构

```json
{
  "id": "evt_01",
  "source": "voice",
  "type": "USER_COMMAND",
  "userId": "usr_01",
  "deviceId": "dev_01",
  "agentSessionId": "ses_01",
  "payload": {
    "text": "Jarvis，向前走两步"
  },
  "createdAt": "2026-06-27T10:00:00.000Z"
}
```

---

## 8. Chat API 与 Robot API 的关系

用户可以通过 `/chat` 输入文本命令：

```text
Jarvis，向前走一点
```

Runtime 仍可能判断为 Robot Intent。

因此：

```text
/chat 不等于一定聊天
/voice 不等于一定语音回复
/runtime/events 不等于开放给所有端
```

核心统一原则：

```text
所有用户输入最终都进入 Runtime Event Pipeline
```

---

## 9. 错误码

| Code | HTTP | 场景 |
|---|---:|---|
| SESSION_ARCHIVED | 400 | Session 已归档 |
| AGENT_NOT_PUBLISHED | 400 | Agent 不可用 |
| DEVICE_CAPABILITY_UNSUPPORTED | 400 | 设备不支持语音或移动 |
| ROBOT_ACTION_REJECTED | 400 | Robot Policy 拒绝 |
| EMERGENCY_STOP_ACTIVE | 409 | 急停状态中 |
| INTERNAL_ERROR | 500 | Runtime 执行失败 |

---

# v1.5.8 Billing Behavior

Runtime Chat API 在 V1 中必须接入 Agent Tokens 成本控制。

文字模式：

```text
余额低于 100 Agent Tokens → 拒绝文字对话
余额足够 → 调用 DeepSeek → 按真实 usage × 1.5 扣 Agent Tokens
```

语音模式：

```text
余额低于 1000 Agent Tokens → 禁用语音回复
余额足够 → STT → DeepSeek → 扣文字成本
↓
调用 ElevenLabs 前再次计算 TTS 预估成本
余额足够 → 生成语音并扣 TTS 成本
余额不足 → 只返回文字，不生成语音
```

语音余额不足响应示例：

```json
{
  "message": {
    "id": "msg_assistant_xxx",
    "role": "assistant",
    "content": "今天天气晴。"
  },
  "audio": null,
  "billing": {
    "status": "TEXT_ONLY_DUE_TO_INSUFFICIENT_VOICE_BALANCE",
    "reason": "余额不足，未生成语音。"
  }
}
```
