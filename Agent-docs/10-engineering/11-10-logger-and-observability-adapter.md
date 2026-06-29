# Logger and Observability Adapter v1.5

## 1. 目标

Jarvis Core 的日志不是为了“看一眼报错”，而是为了定位 Runtime、Device、Robot、LLM、TTS 之间的链路问题。

v1.5 开始必须统一日志接口。

---

## 2. 日志 Port

```typescript
export interface AppLoggerPort {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
```

---

## 3. Trace ID

所有请求必须拥有 `traceId`。

来源顺序：

```text
1. 客户端传入 X-Trace-Id
2. Gateway 自动生成
3. 写入日志、Runtime Event、Action Record
```

---

## 4. 必须记录的关键事件

```text
Auth
├── login.success
├── login.failed
└── token.refresh

Runtime
├── runtime.event.received
├── intent.detected
├── action.created
├── action.completed
└── action.failed

LLM
├── llm.generate.started
├── llm.generate.completed
├── llm.generate.failed
└── llm.stream.chunk

Voice
├── stt.started
├── stt.completed
├── tts.started
├── tts.completed
└── tts.failed

Device
├── device.connected
├── device.disconnected
├── device.heartbeat
└── device.status.changed

Robot
├── robot.command.sent
├── robot.command.ack
├── robot.command.completed
├── robot.command.failed
└── robot.emergency_stop
```

---

## 5. 日志字段规范

```json
{
  "level": "info",
  "message": "runtime.event.received",
  "traceId": "trace_abc",
  "userId": "user_123",
  "deviceId": "device_456",
  "eventId": "evt_789",
  "timestamp": "2026-06-27T10:00:00.000Z",
  "meta": {}
}
```

---

## 6. 敏感信息禁止记录

日志中禁止记录：

```text
- password
- passwordHash
- JWT token
- device token
- API Key
- 原始完整语音文件
- 用户隐私长文本
```

LLM Prompt 只允许在本地开发环境可选开启。

---

## 7. v1.5 实现

v1.5 使用 `ConsoleLoggerAdapter`。

v2 可替换为：

```text
Pino
Winston
OpenTelemetry
Datadog
Grafana Loki
```
