# 19. 机器人移动与语音控制设计

## 1. 文档目的

本文档定义 Jarvis 后续给树莓派增加物理移动能力时的产品、架构、命令、安全与开发边界。

目标设备包括：

```text
电机驱动轮子
履带底盘
腿部结构
舵机结构
未来机械臂
```

本文不规定具体硬件型号，只定义软件系统如何兼容这些能力。

---

## 2. 核心结论

Jarvis 增加移动设备后，不应该被改造成“树莓派自己听懂命令并控制电机”。

正确架构是：

```text
用户语音
↓
Voice Engine
↓
Intent Engine
↓
Robot Engine
↓
Device Command
↓
Robot Device Controller
↓
Motor / Servo / Leg Actuator
```

也就是说：

- Core 负责理解和决策。
- Device 负责执行和本地安全。
- Motor Driver 负责底层驱动。

---

## 3. 产品能力分级

### Level 0：语音终端（V1）

```text
听用户说话
把音频发给 Core
播放 TTS
显示表情
上报在线状态
```

### Level 1：基础移动（V2 初期）

```text
向前
后退
左转
右转
停止
低速移动
障碍物停止
急停
```

### Level 2：半自主移动（V2 后期）

```text
跟着我
回充
简单巡航
避障
根据电量限制动作
```

### Level 3：复杂任务（V3）

```text
去某个房间
找到某个物体
拿取 / 搬运
多步骤规划
视觉识别
地图导航
```

---

## 4. 推荐 V2 初始命令集

V2 初期不要一上来做复杂导航。

建议只做 5 个基础动作：

```text
MOVE_FORWARD
MOVE_BACKWARD
TURN_LEFT
TURN_RIGHT
STOP
```

原因：

- 可测试
- 可控
- 风险低
- 体验立即可见
- 不依赖复杂视觉或地图

---

## 5. 语音命令映射

| 用户语音 | Intent | Command |
|---|---|---|
| 向前走 | ROBOT_MOVE | MOVE_FORWARD |
| 前进一点 | ROBOT_MOVE | MOVE_FORWARD |
| 后退 | ROBOT_MOVE | MOVE_BACKWARD |
| 左转 | ROBOT_TURN | TURN_LEFT |
| 右转 | ROBOT_TURN | TURN_RIGHT |
| 停下 | ROBOT_STOP | STOP |
| 别动 | ROBOT_STOP | STOP |
| 过来一下 | ROBOT_MOVE / FOLLOW_ME | V2 初期建议要求确认 |
| 跟着我 | FOLLOW_ME | V2 后期 |
| 去充电 | DOCK | V2 后期 |

---

## 6. Intent 识别策略

### 6.1 规则优先

基础移动命令必须规则优先。

```text
向前 / 前进 / 往前       → MOVE_FORWARD
后退 / 往后              → MOVE_BACKWARD
左转 / 往左              → TURN_LEFT
右转 / 往右              → TURN_RIGHT
停止 / 停下 / 别动       → STOP
```

### 6.2 LLM 辅助

以下场景再调用 LLM：

- 用户表达模糊
- 动作需要多步骤理解
- 需要结合上下文
- 需要 Planner
- 用户命令包含地点或物体

例如：

```text
去客厅看一下我的水杯在不在。
```

这不是基础移动命令，应进入 V3 Planner。

---

## 7. Command Envelope

Core 下发给设备的命令必须标准化。

```json
{
  "commandId": "cmd_01",
  "type": "MOVE",
  "targetDeviceId": "dev_01",
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

### 7.1 为什么用 distanceCm 而不是 steps

用户会说“两步”，但设备执行不应该直接理解“步”。

Core 需要转换为设备可执行参数：

```text
两步 → 约 80cm
一点 → 约 20cm
过来 → 需要确认或跟随能力
```

---

## 8. Device Command Result

设备执行后必须上报结果。

成功：

```json
{
  "commandId": "cmd_01",
  "status": "DONE",
  "durationMs": 2200,
  "finalState": "IDLE"
}
```

失败：

```json
{
  "commandId": "cmd_01",
  "status": "BLOCKED",
  "error": {
    "code": "OBSTACLE_DETECTED",
    "message": "前方有障碍物"
  }
}
```

超时：

```json
{
  "commandId": "cmd_01",
  "status": "FAILED",
  "error": {
    "code": "COMMAND_TIMEOUT",
    "message": "动作执行超时"
  }
}
```

---

## 9. 硬件抽象层

设备端建议分层：

```text
jarvis-device/
├── app/
│   ├── voice_client.py
│   ├── command_client.py
│   └── telemetry_client.py
├── robot/
│   ├── robot_controller.py
│   ├── motion_planner.py
│   ├── safety_guard.py
│   └── state_machine.py
├── drivers/
│   ├── motor_driver.py
│   ├── servo_driver.py
│   ├── imu_driver.py
│   ├── distance_sensor.py
│   └── battery_monitor.py
└── config/
    └── device.json
```

### 9.1 Robot Controller

负责接收标准命令并调用底层驱动。

### 9.2 Safety Guard

负责本地安全检查。

### 9.3 Drivers

负责具体硬件。

业务代码不应该直接调用 GPIO。

---

## 10. 本地状态机

```text
IDLE
↓
RECEIVED_COMMAND
↓
SAFETY_CHECKING
↓
EXECUTING
↓
DONE
↓
IDLE
```

异常状态：

```text
BLOCKED
FAILED
EMERGENCY_STOPPED
LOW_BATTERY
MOTOR_ERROR
NETWORK_LOST
```

---

## 11. 安全策略

### 11.1 必须支持 STOP

STOP 是最高优先级命令。

无论设备正在：

- 听音频
- 播放语音
- 移动
- 跟随
- 执行任务

都必须立即停止动作。

### 11.2 急停

建议同时支持：

```text
物理急停按钮
Dashboard 急停按钮
语音急停：“停下 / 别动”
自动急停：障碍物 / 倾倒 / 电机异常
```

### 11.3 默认低速

V2 初期所有移动命令默认低速。

```text
speedLevel = LOW
```

不要支持高速模式，直到完成充分测试。

### 11.4 动作范围限制

初期建议限制：

```text
单次前进最大 100cm
单次转向最大 90°
命令超时 5 秒
低电量禁止移动
检测到障碍物禁止移动
```

---

## 12. Dashboard 控制

Dashboard 设备页必须增加：

```text
移动能力开关
急停按钮
当前 Motion State
当前 Battery
当前 Obstacle 状态
最近命令
最近错误
```

对于开发测试，可以提供只对 Admin 可见的手动控制面板：

```text
Forward
Backward
Left
Right
Stop
```

但普通用户侧不建议长期暴露遥控器式 UI，否则产品会从 AI 助手变成遥控车。

---

## 13. API 与通信建议

### V2 初期

```text
WebSocket Command Channel
```

优点：

- 与现有设备状态同步兼容
- 实现简单
- 适合单设备 Demo

### V2 稳定后

考虑：

```text
MQTT
```

适合：

- 多设备
- 网络不稳定
- QoS
- 设备主题订阅

### V3 高级机器人

再考虑：

```text
ROS2 Bridge
```

不要在 V2 初期引入 ROS2，除非团队已经熟悉机器人技术栈。

---

## 14. 数据库建议

V2 初期可以先不新增表，把动作结果写入 `messages.metadata` 与日志。

当需要审计、重试、分析后，再增加：

```text
device_commands
device_telemetry
safety_events
```

---

## 15. 开发顺序建议

### Step 1：软件模拟

不接电机，先实现 Command Mock。

```text
语音：向前走
↓
Core 生成 MOVE Command
↓
Mock Device 返回 DONE
```

### Step 2：设备本地模拟

树莓派接收命令，但只打印日志，不动。

### Step 3：低速电机测试

接入电机驱动，限制速度与时间。

### Step 4：加入 STOP

没有 STOP 不允许继续增加动作。

### Step 5：加入障碍物检测

没有障碍物检测，不允许做跟随或靠近用户。

### Step 6：Dashboard 状态展示

让团队能看到每次命令的状态、错误和遥测。

---

## 16. 不做事项

V2 初期不做：

```text
高速移动
复杂导航
自动靠近人脸
机械臂抓取
无障碍物检测的跟随
无急停的动作测试
让 LLM 直接输出 GPIO 指令
让设备绕过 Core 自己执行自然语言命令
```

---

## 17. 最终原则

> 移动能力是 Jarvis 的身体扩展，不是新的大脑。Core 负责理解、调度和安全策略；设备负责本地执行和物理安全；硬件驱动永远被封装在设备端。
