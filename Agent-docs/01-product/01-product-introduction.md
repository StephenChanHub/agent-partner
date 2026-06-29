# 01. 产品介绍

## 1. 产品定位

Jarvis Platform 是一个以 Agent 为中心的个人 AI 平台。

它不是一个单纯聊天网站，也不是一个只能播放语音回复的树莓派玩具。Jarvis 的长期形态是：

```text
Agent Product
+
Core Runtime
+
Device / Robot Body
+
Dashboard Control Center
+
Studio Agent Factory
```

在 V1，Jarvis 主要完成文本聊天、语音聊天、Agent 切换、设备绑定、消息同步和 Studio 发布。

在 V2，Jarvis 将可以扩展为具身智能终端，例如增加电机轮子、腿部、跟随、靠近、转向、停止、回充等物理动作。

---

## 2. 产品一句话

> Jarvis 是一个可被持续生产、发布、使用和扩展到实体设备的个人 AI Agent 平台。

面向普通用户，它是一个个人 AI 团队。

面向管理员，它是一个 Agent 生产与发布系统。

面向设备，它是一个连接真实世界的智能 Runtime。

---

## 3. 为什么不是普通 AI 聊天产品

普通聊天产品的流程通常是：

```text
用户输入一句话
↓
模型回复一句话
```

Jarvis 的目标流程是：

```text
用户输入 / 语音 / 设备事件
↓
Jarvis Core 接收 Event
↓
Intent Engine 判断意图
↓
Task Dispatcher 分发任务
├── Chat Engine 回答问题
├── Robot Engine 执行动作
└── System Engine 查询系统状态
↓
返回文本、语音、动作结果或设备状态
```

因此，Jarvis 不是“聊天服务”，而是“事件驱动的任务系统”。

---

## 4. 核心产品对象

### 4.1 Agent

Agent 是平台真正的产品。

例如：

```text
Jarvis
Coding Mentor
IELTS Coach
Home Assistant Agent（未来）
Robot Companion Agent（未来）
```

Agent 的配置由 Manifest 描述，包括基础信息、Prompt、Voice、Skill、Permission、Runtime Policy 等。

### 4.2 Agent Session

Agent Session 是用户与某个 Agent 的长期空间。

它不是一次性聊天窗口。

```text
User + Agent = 唯一 Agent Session
```

### 4.3 Device

Device 是用户使用 Jarvis 的实体入口。

V1 Device：

```text
Raspberry Pi
麦克风
扬声器
屏幕表情
网络连接
```

V2 Robot Device：

```text
Raspberry Pi
Motor Driver
Wheel / Leg
IMU / Distance Sensor
Battery
Emergency Stop
Docking（未来）
```

### 4.4 Runtime Event

Runtime Event 是 Jarvis Core 处理所有输入的统一格式。

例如：

```json
{
  "source": "voice",
  "type": "USER_COMMAND",
  "payload": {
    "text": "Jarvis，向前走两步"
  }
}
```

### 4.5 Device Command

Device Command 是 Core 下发给设备的动作命令。

例如：

```json
{
  "type": "MOVE",
  "direction": "FORWARD",
  "distanceCm": 80,
  "maxSpeed": "LOW"
}
```

---

## 5. 三类用户

### 5.1 普通用户

普通用户只使用 Jarvis，不设计 Agent。

可以：

- 选择 Agent
- 聊天
- 语音交互
- 查看历史
- 管理设备
- 查看设备状态
- 在未来授权设备移动能力

不可以：

- 修改 Prompt
- 修改 Skill
- 修改 Voice
- 修改 Model
- 创建或发布 Agent

### 5.2 管理员

管理员通过 Studio 生产 Agent。

可以：

- 创建 Agent
- 编辑 Manifest
- 配置 Voice
- 配置 Skill
- 配置 Permission
- 测试 Agent
- 发布版本
- 回滚版本

### 5.3 Device / Robot Device

设备不是用户登录后的外设，而是具有独立身份的 Jarvis 终端。

设备可以：

- 开机自动连接 Core
- 上报状态
- 接收事件
- 播放语音
- 显示表情
- 在未来执行被授权的物理动作

设备不可以：

- 自己决定 Prompt
- 自己调用 LLM
- 自己绕过 Core 执行动作
- 自己修改用户数据

---

## 6. 产品边界

### V1 必做

```text
账号认证
Agent 列表
Agent Session
文本聊天
语音输入 / 输出
设备绑定
设备在线状态
Studio 发布 Agent
消息同步
```

### V1 预留但不强做

```text
Runtime Event Envelope
Intent Engine 接口
Robot Engine 接口
Device Capability 字段
Command 通道抽象
安全策略框架
```

### V2 再做

```text
移动底盘
轮子 / 腿部控制
语音动作命令
动作状态回报
设备遥测
急停
低速安全模式
回充
跟随
导航
```

### V3 再做

```text
Planner
Executor
视觉识别
地图导航
复杂多步骤任务
机械臂
多机器人协同
```

---

## 7. 最终产品原则

> Jarvis 的价值不是“能聊天”，而是“能通过统一 Runtime 把用户意图转化为对话、工具调用、系统控制和真实世界动作”。

---

## v1.5.5 V1 产品收敛

V1 中，Jarvis 先实现一个稳定的聊天产品：

```text
用户选择 Agent
文字聊天
语音聊天
硬件端语音聊天
所有端共享长期 Agent Session
```

Agent 的人格、能力、行为边界统一由 Studio 中的 `config.prompt` 定义。Agent 展示页支持照片和视频。

复杂 Skill Library、工具调用、机器人动作执行放到 V2。
