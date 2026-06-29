# 04-04. Action Model

## 1. 定义

Action 是 Runtime 分发给执行层的任务。

Intent 只是理解，Action 才是执行。

```text
Runtime Event
↓
Intent
↓
Action
↓
Engine / Adapter / Device
```

---

## 2. Action Domain

v1.3 冻结以下 Action Domain：

```text
CHAT
ROBOT
SYSTEM
SKILL
VOICE
DEVICE
```

| Domain | 说明 |
|---|---|
| CHAT | 调用 Chat Engine / LLM |
| ROBOT | 下发移动、停止、转向等机器人动作 |
| SYSTEM | 查询电量、网络、状态等 |
| SKILL | 调用天气、日历、GitHub 等能力 |
| VOICE | TTS / STT / Voice Playback |
| DEVICE | 设备连接、状态同步、配置下发 |

---

## 3. Action Type

v1.3 冻结以下最小集合：

```text
GENERATE_REPLY
GENERATE_VOICE
MOVE
TURN
STOP
FOLLOW_ME
DOCK
QUERY_STATUS
QUERY_BATTERY
DEVICE_NOTIFY
SKILL_EXECUTE
```

---

## 4. Action Status

```text
PENDING
DISPATCHED
RUNNING
SUCCEEDED
FAILED
CANCELLED
TIMEOUT
REJECTED
```

状态语义：

| 状态 | 说明 |
|---|---|
| PENDING | 已创建，未执行 |
| DISPATCHED | 已分发给 Engine / Device |
| RUNNING | 正在执行 |
| SUCCEEDED | 执行成功 |
| FAILED | 执行失败 |
| CANCELLED | 被取消 |
| TIMEOUT | 超时 |
| REJECTED | 被权限、安全或能力检查拒绝 |

---

## 5. Robot Action Envelope

Robot Action 不能直接等同于电机指令。

Core 下发的是标准动作意图：

```json
{
  "id": "act_01",
  "domain": "ROBOT",
  "type": "MOVE",
  "targetDeviceId": "dev_01",
  "payload": {
    "direction": "FORWARD",
    "distanceCm": 60,
    "speed": "LOW",
    "safety": {
      "stopOnObstacle": true,
      "timeoutMs": 5000
    }
  }
}
```

Device 本地再转换为：

```text
Motor PWM
Servo Angle
Leg Gait
```

---

## 6. 安全规则

Robot Action 执行前必须经过三层检查：

```text
1. Agent Permission Check
2. Device Capability Check
3. Device Local Safety Check
```

### 6.1 Agent Permission Check

来自 Agent Manifest：

```json
{
  "permissions": {
    "robot": {
      "mobility": true,
      "maxSpeed": "LOW"
    }
  }
}
```

### 6.2 Device Capability Check

来自 Device Capabilities：

```json
{
  "mobility": {
    "type": "wheeled",
    "supportsMove": true,
    "supportsTurn": true,
    "maxSpeedLevel": "LOW"
  }
}
```

### 6.3 Device Local Safety Check

设备必须本地检查：

```text
障碍物
倾倒
电量过低
电机过热
急停按钮
通信超时
```

Core 不能假设设备一定安全。

---

## 7. STOP 优先级

`STOP` 是最高优先级 Action。

要求：

```text
STOP 不排队
STOP 不等待 LLM
STOP 不等待普通任务完成
STOP 必须直接进入 Device Safety Channel
```

在 v1.4 Runtime Skeleton 中，应预留：

```typescript
robotActionService.emergencyStop(deviceId)
```

---

## 8. Action 与 Message 的关系

Action 不一定产生用户可见 Message。

例如：

```text
MOVE → 可以产生 “好的，我过来了”
STOP → 可以产生 “我已经停止”
QUERY_BATTERY → 产生 “目前电量 76%”
```

Action 的执行细节记录在 `action_records`，用户可见结果记录在 `messages`。

---

## 9. Prisma 映射

对应模型：

```text
ActionRecord
```

关键字段：

```text
runtimeEventId
deviceId
messageId
domain
type
status
commandPayload
resultPayload
errorCode
errorMessage
createdAt
dispatchedAt
completedAt
```

---

## 10. v1.4 使用方式

v1.4 Runtime Skeleton 中：

```typescript
const action = await actionService.create({
  runtimeEventId,
  domain: 'ROBOT',
  type: 'MOVE',
  deviceId,
  commandPayload: {
    direction: 'FORWARD',
    distanceCm: 60,
    speed: 'LOW'
  }
})

await robotEngine.dispatch(action)
```

不要在 Controller 中直接调用电机或设备命令。
