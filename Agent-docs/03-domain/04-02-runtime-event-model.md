# 04-02. Runtime Event Model

## 1. 定义

Runtime Event 是所有输入进入 Jarvis Core 的统一事件格式。

Jarvis 不应该让不同入口直接调用不同业务逻辑：

```text
错误：
Dashboard → ChatService
Device Voice → VoiceService
Robot Button → RobotService
Timer → SystemService

正确：
所有输入 → Runtime Event → Runtime Pipeline
```

---

## 2. Event Pipeline

```text
External Input
↓
Normalize Event
↓
runtime_events
↓
Intent Engine
↓
intent_records
↓
Task Dispatcher
↓
action_records
↓
Engine Execute
```

---

## 3. Event Source

v1.3 冻结以下 source：

```text
DASHBOARD
DEVICE
STUDIO
SYSTEM
SCHEDULER
WEBHOOK
```

说明：

- `DASHBOARD`：用户在网页输入文本、切换 Agent、点击按钮。
- `DEVICE`：树莓派语音、按键、状态上报。
- `STUDIO`：管理员发布 Agent、测试 Agent。
- `SYSTEM`：Core 内部事件。
- `SCHEDULER`：未来定时任务。
- `WEBHOOK`：未来外部系统触发。

---

## 4. Event Type

v1.3 冻结以下 type：

```text
USER_TEXT
USER_VOICE
DEVICE_CONNECTED
DEVICE_HEARTBEAT
DEVICE_TELEMETRY
ROBOT_ACTION_RESULT
STUDIO_AGENT_PUBLISHED
SYSTEM_TASK
```

V1 最重要的是：

```text
USER_TEXT
USER_VOICE
DEVICE_CONNECTED
DEVICE_HEARTBEAT
ROBOT_ACTION_RESULT
```

---

## 5. Event Status

```text
RECEIVED
PROCESSING
PROCESSED
FAILED
IGNORED
```

状态语义：

| 状态 | 说明 |
|---|---|
| RECEIVED | 已入库，尚未处理 |
| PROCESSING | Runtime 正在处理 |
| PROCESSED | 已完成 Intent / Action 调度 |
| FAILED | Runtime 处理失败 |
| IGNORED | 事件合法，但无需进一步处理 |

---

## 6. 标准结构

```json
{
  "id": "evt_01",
  "source": "DEVICE",
  "type": "USER_VOICE",
  "status": "RECEIVED",
  "userId": "usr_01",
  "deviceId": "dev_01",
  "agentSessionId": "ses_01",
  "rawText": "Jarvis，向前走两步",
  "payload": {
    "audioUrl": "s3://...",
    "text": "Jarvis，向前走两步",
    "language": "zh-CN"
  },
  "createdAt": "2026-06-27T10:00:00.000Z"
}
```

---

## 7. 入库规则

### 7.1 必须入库

以下事件必须写入 `runtime_events`：

```text
USER_TEXT
USER_VOICE
ROBOT_ACTION_RESULT
STUDIO_AGENT_PUBLISHED
```

原因：它们会影响用户可见行为、Agent 行为或设备动作。

---

### 7.2 可不入库

以下事件可以只走 Redis / WebSocket：

```text
高频心跳
实时传感器流
摄像头帧
IMU 原始数据
距离传感器原始数据
```

如果未来需要审计，再抽样或汇总入库。

---

## 8. 与 Message 的关系

不是所有 Runtime Event 都会产生 Message。

例如：

```text
DEVICE_HEARTBEAT → 不产生 Message
USER_TEXT → 通常产生 Message
ROBOT_ACTION_RESULT → 可能产生 Message
```

原则：

```text
Message 是用户可见的聊天历史。
Runtime Event 是系统可审计的输入历史。
```

---

## 9. Prisma 映射

对应模型：

```text
RuntimeEvent
```

关键字段：

```text
source
type
status
userId
deviceId
agentSessionId
rawText
payload
errorCode
errorMessage
createdAt
processedAt
```

---

## 10. v1.4 使用方式

v1.4 Runtime Skeleton 中，所有入口统一创建 Runtime Event：

```typescript
await runtimeService.handleEvent({
  source: 'DASHBOARD',
  type: 'USER_TEXT',
  userId,
  agentSessionId,
  payload: { text }
})
```

不要直接调用：

```typescript
chatService.sendMessage(...)
robotService.move(...)
systemService.queryBattery(...)
```
