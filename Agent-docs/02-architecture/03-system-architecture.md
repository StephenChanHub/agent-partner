# 03. 系统整体架构

## 1. 总体架构

```text
                        Jarvis Platform
────────────────────────────────────────────────────────

                    Jarvis Core（唯一大脑）

       API Gateway + Task Dispatcher + Database + AI Engines

────────────────────────────────────────────────────────
          │                    │                    │
          ▼                    ▼                    ▼
   Device / Robot        User Dashboard        Agent Studio
   树莓派/未来移动设备      用户控制中心          Agent 生产车间
```

系统只有一个大脑：Jarvis Core。所有客户端都连接 Core，不直接访问数据库，不直接调用大模型，不直接绕过 Core 执行动作策略。

---

## 2. 四层平台架构

```text
Layer 1：Product Layer
Layer 2：Application Layer
Layer 3：Core Runtime Layer
Layer 4：Infrastructure Layer
```

### Layer 1：Product

产品只有一个：Jarvis。

用户不是购买 Dashboard，也不是购买树莓派，而是购买一个持续进化的个人 AI 团队。未来如果加入轮子、腿部、摄像头、激光雷达，它们仍然只是 Jarvis 的身体，不改变产品中心。

### Layer 2：Application

```text
Jarvis Platform
├── Jarvis Core
├── Jarvis Device
├── Jarvis Dashboard
└── Jarvis Studio
```

### Layer 3：Core Runtime

```text
Jarvis Core
├── API Gateway
├── Application Managers
├── Runtime Event Bus
├── Intent Engine
├── Task Dispatcher
├── Chat Engine
├── Robot Engine
├── System Engine
├── Skill Engine
├── Memory Engine
├── Voice Engine
├── Model Router
└── Command Gateway
```

### Layer 4：Infrastructure

```text
Infrastructure
├── MySQL
├── Redis
├── Object Storage
├── Queue / Stream
├── Docker
├── Nginx
├── HTTPS
├── GitHub Actions
└── Logs / Metrics / Tracing
```

---

## 3. 最高架构原则

> 所有智能发生在 Core；所有配置发生在 Studio；所有使用发生在 Dashboard / Device；所有真实世界动作必须经过 Intent、Policy、Safety、Command 四层校验。

---

## 4. 应用职责边界

### 4.1 Jarvis Core

负责：

- 用户认证
- 设备认证
- API 服务
- WebSocket / SSE
- Runtime Event 接收
- Intent 识别
- Task Dispatch
- Chat Engine
- Robot Engine
- System Engine
- Prompt 组装
- Skill 调用
- Voice 调用
- LLM 调用
- Device Command 下发
- 消息保存
- Manifest 读取
- 权限控制
- 安全策略
- 日志与错误处理

不负责：

- 页面展示
- 设备动画细节
- 底层 PWM / GPIO 控制
- 电机驱动具体硬件实现

### 4.2 Device / Robot Client

负责：

- 麦克风录音
- 唤醒词
- 上传音频
- 播放音频
- 显示表情
- 上报设备状态
- 接收 Core 事件
- 接收 Device Command
- 本地硬件安全检查
- 控制 Motor Driver / Servo / Leg Controller
- 上报命令执行结果

不负责：

- Prompt
- Memory
- Skill
- Model
- 意图理解决策
- 复杂任务规划
- 数据库存储

### 4.3 User Dashboard

负责：

- 登录注册
- 查看 Agent 列表
- 选择 Agent
- 文本聊天
- 查看历史
- 设备管理
- 用户设置
- 查看设备在线状态
- 查看移动状态、低电量、急停状态
- 未来授权或禁用某些设备动作能力

不负责：

- 创建 Agent
- 修改 Prompt
- 修改 Voice
- 修改 Skill
- 修改 Model
- 直接控制电机

### 4.4 Agent Studio

负责：

- 创建 Agent
- 编辑 Manifest
- 测试 Agent
- 发布版本
- 回滚版本
- 管理 Skill 配置
- 管理 Voice 配置
- 管理 Runtime Policy
- 管理 Robot Permission（未来）

不负责：

- 普通用户聊天
- 设备播放
- 用户私有消息修改
- 直接下发用户设备动作

---

## 5. 核心数据流

### 5.1 用户聊天

```text
Dashboard / Device
↓
Jarvis Core API
↓
Authentication
↓
Runtime Event
↓
Intent Engine
↓
Task Dispatcher
↓
Chat Engine
↓
Agent Session Manager
↓
Manifest Loader
↓
Message Repository
↓
LLM Router
↓
Response Streaming
↓
Dashboard / Device
```

### 5.2 机器人动作

```text
Device Voice Input
↓
Voice Engine STT
↓
Runtime Event
↓
Intent Engine
↓
Robot Intent
↓
Robot Engine
↓
Safety Guard
↓
Command Gateway
↓
WebSocket / MQTT / HTTP Command
↓
Robot Device Controller
↓
Motor / Servo / Leg Actuator
↓
Command Result Event
↓
Core Event Bus
↓
Dashboard + Device Voice Feedback
```

### 5.3 Studio 发布 Agent

```text
Admin
↓
Studio
↓
保存 Draft Manifest
↓
测试
↓
Publish
↓
创建 agent_versions
↓
更新 agents.published_version_id
↓
所有用户自动使用新版本
```

### 5.4 Device 状态同步

```text
Device
↓
WebSocket / Heartbeat / Telemetry
↓
Core Event Bus
↓
Redis Session State
↓
Dashboard / Device Subscribers
```

---

## 6. Runtime 从 Chat Service 升级为 Task Dispatcher

旧理解：

```text
POST /chat
↓
LLM
↓
reply
```

新理解：

```text
Runtime Event
↓
Intent Engine
↓
Task Dispatcher
├── Chat Engine
├── Robot Engine
└── System Engine
```

这样未来增加轮子、腿部、机械臂、摄像头、传感器、家居设备时，不需要推翻整体架构。

---

## 7. Robot 能力边界

Robot Engine 只负责把已识别、已授权、已校验的动作转成标准 Device Command。

它不直接控制硬件。

```text
Robot Engine
↓
Device Command
↓
Device Controller
↓
Hardware Driver
```

硬件控制细节留在设备端，例如：

```text
PWM
GPIO
Motor Driver
Servo Driver
IMU Calibration
Obstacle Detection
```

---

## 8. 安全边界

机器人动作必须经过：

```text
Device Capability Check
↓
User Ownership Check
↓
Agent Permission Check
↓
Runtime Safety Policy
↓
Device Local Safety Check
```

任何一步失败，命令不得执行。

STOP / EMERGENCY_STOP 优先级高于所有动作和聊天。

---

## v1.5.5 V1 架构收敛

V1 Runtime 只跑通：

```text
Text Chat
Voice Chat
Context Builder
Prompt Assembler
LLM Adapter
TTS Adapter
Usage Meter
```

Skill Engine、Robot Engine 保留架构预留，但不进入 V1 功能实现。
