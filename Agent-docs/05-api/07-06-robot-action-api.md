# 07-06. Robot Action API

## 1. 模块职责

Robot Action API 定义未来移动设备的动作命令契约。

它服务于：

```text
电机驱动轮子
履带底盘
腿部结构
舵机结构
未来机械臂
```

V1 不一定实现真实硬件，但 API Contract 从 v1.2 开始预留，避免后续推翻 Runtime 和 Device 架构。

---

## 2. 核心原则

### 2.1 Core 负责理解与决策

```text
语音 / 文本
↓
Intent Engine
↓
Robot Policy Manager
↓
Robot Engine
↓
Command Envelope
```

### 2.2 Device 负责执行与本地安全

设备收到命令后必须先检查：

```text
急停状态
障碍物状态
电量状态
动作能力
速度限制
本地硬件错误
```

### 2.3 STOP 最高优先级

任何情况下：

```text
STOP / emergency-stop
```

都必须优先于普通移动命令。

---

## 3. Robot Command 类型

V2 初期只建议支持：

```text
MOVE
TURN
STOP
```

未来扩展：

```text
FOLLOW
DOCK
DANCE
LOOK_AT
ARM_MOVE
NAVIGATE
```

---

## 4. POST /robot/actions

用户或 Runtime 发起机器人动作。

### Headers

Dashboard：

```http
Authorization: Bearer <access_token>
```

内部 Runtime 可以直接调用 Service，不一定走 HTTP。但 API Contract 保留。

### Request：MOVE

```json
{
  "agentSessionId": "ses_01",
  "targetDeviceId": "dev_01",
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
```

### Request：TURN

```json
{
  "agentSessionId": "ses_01",
  "targetDeviceId": "dev_01",
  "type": "TURN",
  "payload": {
    "direction": "LEFT",
    "angleDeg": 45,
    "speedLevel": "LOW"
  },
  "safety": {
    "requiresObstacleCheck": true,
    "emergencyStopEnabled": true
  },
  "timeoutMs": 4000
}
```

### Request：STOP

```json
{
  "targetDeviceId": "dev_01",
  "type": "STOP",
  "payload": {
    "mode": "NORMAL"
  },
  "timeoutMs": 1000
}
```

### Response

```json
{
  "data": {
    "commandId": "cmd_01",
    "targetDeviceId": "dev_01",
    "type": "MOVE",
    "status": "QUEUED",
    "createdAt": "2026-06-27T10:00:00.000Z"
  },
  "requestId": "req_01"
}
```

---

## 5. Command Envelope

Core 下发给 Device 的标准命令：

```json
{
  "commandId": "cmd_01",
  "type": "MOVE",
  "targetDeviceId": "dev_01",
  "agentSessionId": "ses_01",
  "source": "VOICE",
  "payload": {
    "direction": "FORWARD",
    "distanceCm": 80,
    "speedLevel": "LOW"
  },
  "safety": {
    "requiresObstacleCheck": true,
    "emergencyStopEnabled": true,
    "maxSpeedLevel": "LOW"
  },
  "timeoutMs": 5000,
  "createdAt": "2026-06-27T10:00:00.000Z"
}
```

---

## 6. Command Status

```text
QUEUED
SENT
ACCEPTED
RUNNING
DONE
FAILED
CANCELLED
REJECTED
TIMEOUT
```

说明：

| Status | 说明 |
|---|---|
| QUEUED | Core 已创建命令 |
| SENT | 已通过 WebSocket 发给设备 |
| ACCEPTED | 设备接受命令 |
| RUNNING | 设备正在执行 |
| DONE | 执行完成 |
| FAILED | 执行失败 |
| CANCELLED | 被用户或系统取消 |
| REJECTED | Policy 或设备拒绝 |
| TIMEOUT | 超时 |

---

## 7. GET /robot/actions/{commandId}

查询命令状态。

### Response

```json
{
  "data": {
    "commandId": "cmd_01",
    "type": "MOVE",
    "targetDeviceId": "dev_01",
    "status": "DONE",
    "result": {
      "durationMs": 2200,
      "distanceCm": 78,
      "stoppedByObstacle": false
    },
    "createdAt": "2026-06-27T10:00:00.000Z",
    "completedAt": "2026-06-27T10:00:02.200Z"
  },
  "requestId": "req_01"
}
```

---

## 8. POST /robot/actions/{commandId}/cancel

取消正在执行或排队中的命令。

### Request

```json
{
  "reason": "user_cancelled"
}
```

### Response

```json
{
  "data": {
    "commandId": "cmd_01",
    "status": "CANCELLED"
  },
  "requestId": "req_01"
}
```

---

## 9. POST /robot/emergency-stop

触发急停。

### Headers

Dashboard：

```http
Authorization: Bearer <access_token>
```

Device 本地触发也可以通过 Device Token 上报。

### Request

```json
{
  "targetDeviceId": "dev_01",
  "reason": "user_pressed_stop"
}
```

### Response

```json
{
  "data": {
    "targetDeviceId": "dev_01",
    "emergencyStop": true,
    "commandId": "cmd_stop_01"
  },
  "requestId": "req_01"
}
```

---

## 10. POST /robot/emergency-stop/release

解除急停。

### Request

```json
{
  "targetDeviceId": "dev_01",
  "confirm": true
}
```

### Response

```json
{
  "data": {
    "targetDeviceId": "dev_01",
    "emergencyStop": false
  },
  "requestId": "req_01"
}
```

---

## 11. Device Command Result

设备执行完成后通过 WebSocket 或 HTTP 上报。

### WebSocket Event

```json
{
  "event": "robot.command.result",
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

### HTTP Fallback

未来也可以保留：

```http
POST /robot/actions/{commandId}/result
```

v1.2 暂不作为主接口，优先 WebSocket。

---

## 12. Robot Policy Check

Robot Engine 创建命令前必须检查：

```text
用户是否拥有设备
设备是否在线
设备是否支持 mobility
Agent 是否允许 robot 权限
当前是否急停
电量是否足够
是否有障碍物
动作是否需要确认
```

---

## 13. 语音到命令映射

| 用户语音 | Intent | Command |
|---|---|---|
| 向前走 | ROBOT_MOVE | MOVE FORWARD |
| 前进一点 | ROBOT_MOVE | MOVE FORWARD 20cm |
| 向前走两步 | ROBOT_MOVE | MOVE FORWARD 80cm |
| 后退 | ROBOT_MOVE | MOVE BACKWARD |
| 左转 | ROBOT_TURN | TURN LEFT |
| 右转 | ROBOT_TURN | TURN RIGHT |
| 停下 | ROBOT_STOP | STOP |
| 别动 | ROBOT_STOP | STOP |

---

## 14. 错误码

| Code | HTTP | 场景 |
|---|---:|---|
| DEVICE_OFFLINE | 409 | 设备离线 |
| DEVICE_CAPABILITY_UNSUPPORTED | 400 | 不支持移动能力 |
| ROBOT_ACTION_REJECTED | 400 | Policy 拒绝 |
| ROBOT_ACTION_TIMEOUT | 408 | 动作超时 |
| EMERGENCY_STOP_ACTIVE | 409 | 急停状态中 |
| FORBIDDEN | 403 | 用户无权控制设备 |
