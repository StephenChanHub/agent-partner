# 07-08. WebSocket Events

## 1. 文档目的

WebSocket 用于 Jarvis 的实时同步。

适用场景：

```text
Dashboard 同步当前 Session
Device 在线状态
设备表情 / 状态变化
Robot Command 下发
Robot Command Result 上报
Agent 发布后通知客户端
Emergency Stop
```

不适合场景：

```text
Chat token streaming
```

Chat token streaming 优先使用 SSE。

---

## 2. 连接地址

Dashboard：

```text
/api/v1/ws?token=<user_access_token>
```

Device：

```text
/api/v1/ws/device?token=<device_token>
```

---

## 3. 标准事件结构

```json
{
  "event": "device.status.changed",
  "id": "evt_ws_01",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {}
}
```

---

## 4. Dashboard Events

### session.current.changed

当前 Agent Session 被切换。

```json
{
  "event": "session.current.changed",
  "id": "evt_ws_01",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "sessionId": "ses_01",
    "agent": {
      "slug": "jarvis",
      "name": "Jarvis"
    }
  }
}
```

### message.created

有新消息产生。

```json
{
  "event": "message.created",
  "id": "evt_ws_02",
  "timestamp": "2026-06-27T10:00:01.000Z",
  "data": {
    "sessionId": "ses_01",
    "message": {
      "id": "msg_01",
      "role": "ASSISTANT",
      "contentType": "TEXT"
    }
  }
}
```


### message.audio.available

当某条 assistant message 生成了短期音频，并且当前 Web 客户端在线时，Core 可以广播该事件。

```json
{
  "event": "message.audio.available",
  "id": "evt_ws_audio_01",
  "timestamp": "2026-06-28T10:00:00.000Z",
  "data": {
    "sessionId": "ses_01",
    "messageId": "msg_assistant_01",
    "tempUrl": "/api/v1/runtime/audio/temp/aud_01.mp3",
    "mimeType": "audio/mpeg",
    "storagePolicy": "CLIENT_PERSISTENT_INDEXEDDB",
    "expiresIn": 600
  }
}
```

Web 收到后应在有效期内下载音频，并按 `messageId` 保存到 IndexedDB。

如果客户端离线，之后只能通过文字历史看到该消息，除非重新生成语音。

### agent.published

Agent 发布新版本。

```json
{
  "event": "agent.published",
  "id": "evt_ws_03",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "agentId": "agt_01",
    "slug": "jarvis",
    "version": "1.1.0"
  }
}
```

---

## 5. Device Events：Core → Device

### device.command

Core 下发设备命令。

```json
{
  "event": "device.command",
  "id": "evt_ws_10",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "commandId": "cmd_01",
    "type": "MOVE",
    "payload": {
      "direction": "FORWARD",
      "distanceCm": 80,
      "speedLevel": "LOW"
    },
    "safety": {
      "requiresObstacleCheck": true,
      "emergencyStopEnabled": true
    },
    "timeoutMs": 5000
  }
}
```

### device.expression.set

设置设备表情。

```json
{
  "event": "device.expression.set",
  "id": "evt_ws_11",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "expression": "THINKING"
  }
}
```

### device.speech.play

播放 TTS。

```json
{
  "event": "device.speech.play",
  "id": "evt_ws_12",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "audioUrl": "/api/v1/audio/tts_01.mp3",
    "text": "好的，我向前移动。"
  }
}
```

### device.unbound

设备被解绑。

```json
{
  "event": "device.unbound",
  "id": "evt_ws_13",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "reason": "user_unbound"
  }
}
```

---

## 6. Device Events：Device → Core

### device.status.changed

设备状态变化。

```json
{
  "event": "device.status.changed",
  "id": "evt_ws_20",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "deviceId": "dev_01",
    "status": "LISTENING"
  }
}
```

### device.telemetry.updated

设备 Telemetry 更新。

```json
{
  "event": "device.telemetry.updated",
  "id": "evt_ws_21",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "deviceId": "dev_01",
    "battery": {
      "level": 76,
      "charging": false
    },
    "mobility": {
      "state": "IDLE",
      "emergencyStop": false,
      "obstacleDetected": false
    }
  }
}
```

### robot.command.accepted

设备接受命令。

```json
{
  "event": "robot.command.accepted",
  "id": "evt_ws_22",
  "timestamp": "2026-06-27T10:00:00.100Z",
  "data": {
    "commandId": "cmd_01",
    "status": "ACCEPTED"
  }
}
```

### robot.command.result

设备上报命令结果。

```json
{
  "event": "robot.command.result",
  "id": "evt_ws_23",
  "timestamp": "2026-06-27T10:00:02.200Z",
  "data": {
    "commandId": "cmd_01",
    "status": "DONE",
    "result": {
      "durationMs": 2200,
      "distanceCm": 78,
      "stoppedByObstacle": false
    }
  }
}
```

### robot.emergency_stop.triggered

设备本地触发急停。

```json
{
  "event": "robot.emergency_stop.triggered",
  "id": "evt_ws_24",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "deviceId": "dev_01",
    "reason": "local_button"
  }
}
```

---

## 7. 连接生命周期

```text
CONNECTING
↓
AUTHENTICATED
↓
ONLINE
↓
DISCONNECTED
```

Device 断线后：

```text
1. Core 将 Device 标记为 OFFLINE
2. Dashboard 收到 device.status.changed
3. 未完成 Robot Command 标记为 TIMEOUT 或 FAILED
```

---

## 8. Heartbeat

建议：

```text
Device 每 10 秒发送一次 heartbeat
Core 超过 30 秒未收到则标记 offline
```

WebSocket 心跳事件：

```json
{
  "event": "heartbeat",
  "id": "evt_ws_hb_01",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "data": {
    "deviceId": "dev_01"
  }
}
```

---

## 9. Event 命名规范

```text
domain.object.action
```

例如：

```text
device.status.changed
robot.command.result
session.current.changed
agent.published
```

---

## 10. 安全要求

WebSocket 必须校验：

```text
User JWT / Device Token
用户是否拥有设备
设备是否绑定
设备是否被禁用
```

Robot Command 下发前必须再次执行 Robot Policy Check。
