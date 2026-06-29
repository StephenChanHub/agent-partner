# 15. 可观测性与运维

## 1. 目标

Jarvis Platform 必须能回答三个问题：

1. 用户请求发生了什么？
2. Runtime 为什么这样响应？
3. 设备现在是否安全、在线、可用？

未来加入机器人移动能力后，还必须能回答：

1. 哪个用户在什么时候触发了哪个动作？
2. 命令是否下发、是否执行、是否被阻止？
3. 是否发生了急停、障碍物、电机异常或低电量阻断？

---

## 2. 日志分类

```text
Application Logs
Runtime Logs
Device Logs
Command Logs（V2）
Safety Logs（V2）
Audit Logs
```

---

## 3. Runtime 日志

每次 Runtime 执行记录：

```json
{
  "eventId": "evt_01",
  "userId": "usr_01",
  "deviceId": "dev_01",
  "agentSessionId": "ses_01",
  "intent": "ROBOT_MOVE",
  "engine": "RobotEngine",
  "status": "DONE",
  "latencyMs": 320
}
```

---

## 4. Chat 指标

```text
chat_request_total
chat_success_total
chat_error_total
chat_latency_ms
llm_latency_ms
stt_latency_ms
tts_latency_ms
message_created_total
```

---

## 5. Device 指标

```text
device_online_total
device_offline_total
device_heartbeat_latency_ms
device_reconnect_total
device_voice_upload_total
device_ws_disconnect_total
```

---

## 6. Robot Command 指标（V2）

```text
robot_command_total
robot_command_success_total
robot_command_failed_total
robot_command_blocked_total
robot_command_timeout_total
robot_emergency_stop_total
robot_obstacle_detected_total
robot_low_battery_block_total
```

---

## 7. Telemetry

移动设备需要上报遥测：

```json
{
  "deviceId": "dev_01",
  "batteryPercent": 76,
  "isCharging": false,
  "motionState": "IDLE",
  "obstacleDetected": false,
  "motorTemperature": 41.2,
  "timestamp": "2026-06-27T10:00:00Z"
}
```

建议策略：

- 普通在线：低频上报。
- 移动中：高频上报。
- 异常：立即上报。
- 高频原始数据不一定全部入 MySQL，可以先进入日志或 Redis。

---

## 8. Trace ID

所有链路必须带 Trace ID。

```text
voice_upload
↓ trace_id
stt
↓ trace_id
intent
↓ trace_id
robot_command
↓ trace_id
device_result
↓ trace_id
```

这样团队才能复盘一次语音命令为什么成功或失败。

---

## 9. Command Audit

V2 每条机器人命令至少记录：

```text
command_id
user_id
device_id
source_event_id
command_type
payload
status
created_at
sent_at
completed_at
error_code
```

涉及安全的命令，不能只靠普通日志。

---

## 10. Safety Event

必须记录：

```text
EMERGENCY_STOP_TRIGGERED
OBSTACLE_DETECTED
LOW_BATTERY_BLOCKED
MOTOR_ERROR
COMMAND_TIMEOUT
DEVICE_TILTED
```

Safety Event 应在 Dashboard 或 Admin 工具中可见。

---

## 11. 告警

建议告警规则：

| 告警 | 条件 |
|---|---|
| Device Offline | 设备超过 2 分钟无心跳 |
| Voice Error Spike | STT / TTS 错误率升高 |
| Robot Command Timeout | 多次动作超时 |
| Emergency Stop | 任何急停触发 |
| Motor Error | 电机异常 |
| Low Battery | 低电量 |

---

## 12. 运维面板

V1 Admin 运维面板：

```text
在线设备数
活跃用户数
Runtime 错误
LLM 错误
STT/TTS 错误
消息量
```

V2 增加：

```text
移动设备数
执行中命令数
急停设备数
最近 Safety Event
设备电量分布
Command Success Rate
```

---

## 13. 发布与回滚

机器人动作相关发布必须更谨慎。

建议：

```text
开发环境 Mock
↓
设备无电机 Dry Run
↓
低速真实设备测试
↓
单用户灰度
↓
全量发布
```

任何 Robot Engine 或 Device Controller 更新，都必须能快速回滚。

---

## 14. 最终原则

> 聊天错误影响体验；机器人动作错误可能影响物理安全。因此机器人相关日志、指标、审计和告警必须高于普通聊天能力。


---

# v1.5 Observability Adapter Update

v1.5 增加统一 `AppLoggerPort`，所有模块必须通过 Logger Port 输出日志。

## 新增关键日志域

```text
infrastructure.config.loaded
infrastructure.prisma.connected
infrastructure.redis.connected
infrastructure.llm.request
infrastructure.tts.request
infrastructure.stt.request
infrastructure.device.event.sent
infrastructure.robot.command.sent
infrastructure.robot.command.timeout
```

## Trace ID 贯穿范围

```text
HTTP Request
Runtime Event
Intent Record
Action Record
LLM Call
TTS Call
Device Event
Robot Command
```

这保证后续排查 “用户说了一句话，但是机器人没动” 时，可以通过一个 traceId 串起完整链路。
