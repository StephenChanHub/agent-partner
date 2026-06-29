# 04-03. Intent Model

## 1. 定义

Intent 是 Runtime 对 Runtime Event 的结构化理解。

Jarvis 的每次输入都必须先回答：

```text
这是聊天？
这是机器人动作？
这是系统查询？
这是 Skill 调用？
还是未知输入？
```

---

## 2. Intent Pipeline

```text
Runtime Event
↓
Intent Engine
├── Rule-based Intent
├── Lightweight Classifier（未来）
└── LLM Intent Fallback（未来）
↓
Intent Record
```

---

## 3. Domain

v1.3 冻结以下 Intent Domain：

```text
CHAT
ROBOT
SYSTEM
SKILL
UNKNOWN
```

| Domain | 说明 |
|---|---|
| CHAT | 普通聊天、问答、写作、代码解释 |
| ROBOT | 移动、停止、跟随、回充等身体动作 |
| SYSTEM | 电量、网络、状态、关机、重启等系统能力 |
| SKILL | 天气、日历、GitHub、搜索等外部能力 |
| UNKNOWN | 无法判断或低置信度输入 |

---

## 4. Intent Name

v1.3 冻结最小集合：

```text
CHAT_MESSAGE
MOVE
TURN
STOP
FOLLOW_ME
DOCK
QUERY_STATUS
QUERY_BATTERY
PLAY_VOICE
UNKNOWN
```

说明：

- `MOVE`：向前、后退、移动指定距离。
- `TURN`：左转、右转、旋转指定角度。
- `STOP`：立即停止，安全优先级最高。
- `FOLLOW_ME`：未来跟随模式。
- `DOCK`：未来回充。
- `QUERY_STATUS`：设备状态查询。
- `QUERY_BATTERY`：电量查询。

---

## 5. Intent Status

```text
DETECTED
CONFIRMED
REJECTED
LOW_CONFIDENCE
FAILED
```

| 状态 | 说明 |
|---|---|
| DETECTED | 已识别意图 |
| CONFIRMED | 可执行意图 |
| REJECTED | 被权限、安全或能力检查拒绝 |
| LOW_CONFIDENCE | 置信度不足，需要 fallback 或确认 |
| FAILED | 识别过程异常 |

---

## 6. Hybrid Intent

Jarvis 不应该把所有语音都交给大模型判断。

基础动作必须优先走本地规则：

```text
向前
后退
左转
右转
停止
不要动
跟着我
回去充电
还有多少电
```

推荐策略：

```text
Rule-based Intent < 100ms
↓ 如果命中
直接生成 Intent
↓ 如果未命中
进入 LLM / Chat
```

原因：

- 移动控制必须低延迟。
- STOP 必须立即响应。
- 大模型输出不适合直接控制硬件。

---

## 7. 标准结构

```json
{
  "id": "int_01",
  "runtimeEventId": "evt_01",
  "domain": "ROBOT",
  "name": "MOVE",
  "status": "CONFIRMED",
  "confidence": 0.96,
  "slots": {
    "direction": "FORWARD",
    "distanceCm": 60,
    "speed": "LOW"
  },
  "reason": "Matched rule: 向前 + 两步",
  "createdAt": "2026-06-27T10:00:00.000Z"
}
```

---

## 8. Slot 规范

### 8.1 MOVE

```json
{
  "direction": "FORWARD | BACKWARD",
  "distanceCm": 60,
  "steps": 2,
  "speed": "LOW | MEDIUM"
}
```

### 8.2 TURN

```json
{
  "direction": "LEFT | RIGHT",
  "angleDeg": 90,
  "speed": "LOW"
}
```

### 8.3 STOP

```json
{
  "reason": "USER_COMMAND"
}
```

### 8.4 QUERY_BATTERY

```json
{
  "targetDeviceId": "dev_01"
}
```

---

## 9. 与 Agent Manifest 的关系

Intent 是否可执行，必须检查 Agent Manifest 的权限：

```json
{
  "permissions": {
    "robot": {
      "mobility": true,
      "maxSpeed": "LOW",
      "allowFollow": false,
      "allowDock": false
    }
  }
}
```

如果 Agent 不允许机器人动作，则 Intent 可以识别，但 Action 必须拒绝。

---

## 10. Prisma 映射

对应模型：

```text
IntentRecord
```

关键字段：

```text
runtimeEventId
domain
name
status
confidence
slots
reason
createdAt
```
