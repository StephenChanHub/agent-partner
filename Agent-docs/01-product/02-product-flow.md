# 02. 产品流程

## 1. User 日常流程

### 第一次使用

```text
访问 Dashboard
↓
注册账号
↓
登录
↓
进入 Dashboard
↓
系统加载 Agent 列表
↓
点击 Jarvis
↓
如果没有 Agent Session
↓
自动创建
↓
开始聊天
```

整个流程没有“新建聊天”按钮。

一个用户与一个 Agent 只有一个长期 Agent Session。

---

## 2. 第二次使用

```text
登录 Dashboard
↓
读取 users.current_session_id
↓
恢复上次 Agent Session
↓
继续聊天
```

---

## 3. 树莓派语音聊天流程

```text
设备开机
↓
读取 device_token
↓
连接 Core
↓
设备状态 Online
↓
显示 Idle 表情
```

用户说：

```text
Hey Jarvis
```

流程：

```text
Device Listening
↓
录音
↓
POST /voice 或 WebSocket Audio Stream
↓
Voice Engine STT
↓
Runtime Event
↓
Intent Engine
↓
Chat Engine
↓
LLM Router
↓
Voice Engine TTS
↓
Device Speaking
↓
Idle
```

Dashboard 同步看到消息和设备状态。

---

## 4. 未来移动设备语音控制流程

用户说：

```text
Jarvis，向前走两步。
```

Core 处理流程：

```text
Device Audio
↓
Voice Engine STT
↓
Runtime Event
↓
Intent Engine
↓
识别为 Robot Intent
↓
Robot Engine
↓
Safety Guard
↓
Device Command
↓
WebSocket 下发设备
```

设备执行流程：

```text
收到 MOVE Command
↓
检查本地安全状态
↓
Motor Controller
↓
Left Motor / Right Motor 或 Leg Controller
↓
执行移动
↓
上报 Command DONE / FAILED
↓
Core 生成语音反馈
```

用户听到：

```text
好的，我向前走了两步。
```

---

## 5. Chat Intent 与 Robot Intent 的区别

### Chat Intent

用户说：

```text
Jarvis，解释一下 TCP。
```

流程：

```text
Intent Engine
↓
CHAT
↓
Chat Engine
↓
LLM
↓
文本 / 语音回复
```

### Robot Intent

用户说：

```text
Jarvis，左转一点。
```

流程：

```text
Intent Engine
↓
ROBOT_ACTION
↓
Robot Engine
↓
Device Command TURN_LEFT
↓
设备执行
↓
结果反馈
```

### System Intent

用户说：

```text
Jarvis，现在还有多少电？
```

流程：

```text
Intent Engine
↓
SYSTEM_QUERY
↓
System Engine
↓
读取设备 Telemetry
↓
语音回复
```

---

## 6. Hybrid Intent 流程

物理动作不应该每次都依赖大模型判断。

原因：

- 动作命令对延迟敏感。
- 基础命令模式有限。
- 误判可能带来安全风险。
- 本地或服务端规则识别可以做到更快、更稳定。

推荐流程：

```text
用户文本
↓
Rule-based Intent Parser
├── 命中明确动作：MOVE / TURN / STOP / DOCK
│   ↓
│   Robot Engine
│
└── 未命中或语义复杂
    ↓
    LLM Intent Classifier
    ↓
    Planner / Chat Engine
```

### 本地规则样例

```text
向前 / 前进 / 过来      → MOVE_FORWARD
后退 / 向后             → MOVE_BACKWARD
左转 / 往左             → TURN_LEFT
右转 / 往右             → TURN_RIGHT
停 / 停下 / 别动        → STOP
跟着我                  → FOLLOW_ME
去充电 / 回去充电       → DOCK
```

---

## 7. 移动设备的状态流

```text
OFFLINE
↓
CONNECTING
↓
ONLINE_IDLE
↓
LISTENING
↓
INTENT_ANALYZING
↓
COMMAND_PENDING
↓
MOVING / TURNING / FOLLOWING
↓
COMMAND_DONE
↓
ONLINE_IDLE
```

异常状态：

```text
OBSTACLE_DETECTED
LOW_BATTERY
MOTOR_ERROR
EMERGENCY_STOPPED
COMMAND_TIMEOUT
NETWORK_LOST
```

---

## 8. Admin / Studio 流程

管理员创建 Agent：

```text
登录 Studio
↓
Create Agent
↓
填写基本信息
↓
配置 Prompt
↓
配置 Voice
↓
配置 Skill
↓
配置 Permission
↓
保存 Draft
↓
测试
↓
Publish
```

对于未来 Robot Agent，Studio 需要额外配置：

```text
允许机器人动作？
允许哪些动作？
是否允许跟随？
最大速度等级？
是否必须用户二次确认？
是否仅允许本地局域网设备？
```

---

## 9. 产品体验原则

1. 普通用户不理解“电机命令”，只说自然语言。
2. Core 负责把自然语言转成安全动作。
3. Device 只执行被授权、被校验、可停止的命令。
4. STOP / 急停优先级高于一切。
5. Dashboard 必须能看到当前设备是否在移动、是否被急停、是否低电量。


---

## v1.5.4 Usage & Billing Foundation

新增用户余额和用量基础能力：普通用户可查看自己的 token 余额和使用明细；管理员可查看用户邮箱、昵称、最后上线时间、余额、累计消耗，并可在 V1 手动调整测试余额。


---

## v1.5.5 Agent Config Simplification

V1 Agent 创建流程收敛为：

```text
填写基础信息
↓
配置照片墙和视频墙
↓
选择大模型
↓
选择音色
↓
填写 Config Prompt
↓
测试文字和语音
↓
发布
```

V1 不做 Skill Library、工具调用和复杂行为策略编辑器。
---

# V1 Audio Sync 补充

V1 阶段，网页端和硬件端的会话同步基于文字消息。

```text
Core 保存文字历史
Web 展示文字历史，并可本地缓存语音
Device 只播放当前语音，不保存音频
```

用户通过树莓派聊天后，网页端也能看到同一条文字消息。如果网页端在线并在 Core 临时音频有效期内，可以下载语音并存入 IndexedDB；如果换另一台电脑登录，则只能看到文字，没有本地语音。
