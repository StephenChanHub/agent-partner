# 06. Jarvis Core 内部架构

## 1. Core 的定位

Jarvis Core 不是一个简单的 Node 服务。

它是 Jarvis Platform 的 AI Operating System，负责接收请求、认证身份、加载 Agent、组装上下文、识别意图、调度任务、调用模型、下发设备命令、保存消息、推送事件。

从 v1.1 开始，Core 的定位从“聊天运行时”升级为：

> **事件驱动的任务调度器（Event-driven Task Dispatcher）。**

---

## 2. Core 四层结构

```text
Jarvis Core
────────────────────────────
API Layer
Application Layer
Runtime Layer
Infrastructure Layer
```

---

## 3. API Layer

### 职责

- 接收 HTTP 请求
- 接收 WebSocket 连接
- 接收 SSE 订阅
- 接收设备音频上传
- 接收设备状态与 Telemetry
- 解析请求参数
- 执行认证中间件
- 调用 Application Layer

### 禁止

API Layer 不允许写业务逻辑。

错误示例：

```ts
if (text.includes('向前')) {
  // 禁止在 Controller 里判断动作意图
}
```

正确方式：

```text
Controller
↓
Runtime Event
↓
Intent Engine
↓
Robot Engine
```

---

## 4. Application Layer

Application Layer 负责业务流程编排。

### 4.1 Authentication Manager

负责：

- 用户登录
- 用户注册
- JWT 签发
- JWT 刷新
- 管理员权限
- 设备令牌认证

### 4.2 Agent Manager

负责：

- 获取 Agent 列表
- 获取当前发布版本
- 加载 Manifest
- 校验 Agent 状态

### 4.3 Agent Session Manager

负责：

- 查询或创建 Agent Session
- 维护 `UNIQUE(user_id, agent_id)`
- Archive Session
- 更新 `users.current_session_id`

### 4.4 Message Manager

负责：

- 保存用户消息
- 保存助手消息
- 分页读取历史
- 读取最近上下文消息
- 保存动作反馈类消息的 metadata

### 4.5 Device Manager

负责：

- 设备绑定
- 设备连接
- 心跳
- 离线检测
- 设备状态上报
- 设备能力上报
- 设备事件下发
- 设备动作结果接收

### 4.6 Studio Manager

负责：

- 创建 Agent
- 编辑 Draft Manifest
- 发布 Agent Version
- 回滚版本
- Manifest Hash 校验

### 4.7 Robot Policy Manager（V2）

负责：

- 判断用户是否允许设备移动
- 判断 Agent 是否拥有 Robot Permission
- 判断设备是否支持目标动作
- 判断动作是否需要二次确认
- 判断当前电量、障碍物、急停状态是否允许动作

---

## 5. Runtime Layer

Runtime Layer 是真正的大脑。

### 5.1 Runtime Event Pipeline

所有输入统一为 Runtime Event。

```text
HTTP / WebSocket / Voice / Device Telemetry
↓
Runtime Event
↓
Intent Engine
↓
Task Dispatcher
├── Chat Engine
├── Robot Engine
├── System Engine
└── Skill Engine
```

### 5.2 Runtime Event 示例

```json
{
  "source": "voice",
  "type": "USER_COMMAND",
  "userId": "usr_01",
  "deviceId": "dev_01",
  "payload": {
    "text": "Jarvis，向前走两步"
  }
}
```

---

## 6. Intent Engine

Intent Engine 负责判断用户到底想做什么。

### 6.1 Intent 类型

```text
CHAT
ROBOT_ACTION
SYSTEM_QUERY
SKILL_ACTION
AGENT_SWITCH
UNKNOWN
```

### 6.2 Hybrid Intent 策略

优先使用规则识别低延迟、高确定性的命令：

```text
向前 / 前进       → MOVE_FORWARD
后退 / 向后       → MOVE_BACKWARD
左转              → TURN_LEFT
右转              → TURN_RIGHT
停止 / 停下       → STOP
跟着我            → FOLLOW_ME
回去充电          → DOCK
```

规则无法判断时，再调用 LLM 做语义分类。

### 6.3 为什么不能全靠 LLM

机器人动作对延迟和安全高度敏感。如果每个动作命令都让 LLM 判断，会导致：

- 延迟增加
- 成本增加
- 离线不可用
- 安全边界变模糊
- 可测试性下降

因此，基础动作命令必须规则优先、LLM 辅助。

---

## 7. Task Dispatcher

Task Dispatcher 根据 Intent 分发任务。

```text
CHAT          → Chat Engine
ROBOT_ACTION  → Robot Engine
SYSTEM_QUERY  → System Engine
SKILL_ACTION  → Skill Engine
AGENT_SWITCH  → Agent Session Manager
UNKNOWN       → Chat Engine 或澄清问题
```

---

## 8. Chat Engine

Chat Engine 负责传统聊天流程。

```text
收到 Chat Intent
↓
读取 User
↓
读取 Agent Session
↓
读取 Agent Manifest
↓
读取最近 Messages
↓
构建 Runtime Context
↓
调用 Skill Engine（如需要）
↓
调用 LLM Router
↓
保存 Assistant Message
↓
返回响应
```

---

## 9. Robot Engine

Robot Engine 负责把机器人意图转换为设备命令。

```text
Robot Intent
↓
Device Capability Check
↓
User Ownership Check
↓
Agent Permission Check
↓
Runtime Safety Policy
↓
Command Builder
↓
Command Gateway
↓
Device
```

### 9.1 Robot Engine 支持的动作

V2 初期建议只支持：

```text
MOVE_FORWARD
MOVE_BACKWARD
TURN_LEFT
TURN_RIGHT
STOP
```

V2 后期再支持：

```text
FOLLOW_ME
DOCK
DANCE
PATROL
```

V3 再支持：

```text
NAVIGATE_TO
FIND_OBJECT
BRING_OBJECT
MULTI_STEP_PLAN
```

### 9.2 Command 示例

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
  "timeoutMs": 5000
}
```

---

## 10. System Engine

System Engine 负责系统类请求。

例如：

```text
电量多少？
WiFi 正常吗？
你现在在线吗？
现在是什么状态？
关机。
重启。
```

系统请求不应该走 LLM，除非需要自然语言润色。

---

## 11. Prompt Builder

Prompt Builder 只服务 Chat Engine。

Robot Engine 不应该通过 Prompt 直接执行动作。

如果需要自然语言回复，Robot Engine 执行动作后可以请求 Voice Engine 生成固定模板语音：

```text
好的，我已经向前移动。
前方有障碍物，我不能继续移动。
电量太低，无法执行移动。
```

---

## 12. Voice Engine

负责：

```text
STT
TTS
Voice Cache
Emotion Mapping（V2）
```

Voice Engine 不判断业务意图。

---

## 13. Memory Engine

V1 策略：最近消息上下文。

V2 再扩展：

```text
Summary
Long Memory
Embedding
Recall
```

机器人动作默认不进入长期 Memory，除非用户明确表达偏好，例如：

```text
以后你靠近我的时候慢一点。
```

---

## 14. LLM Router

V1 可以只路由到一个默认模型。

未来支持：

```text
Gemini
GPT
Claude
DeepSeek
Local Model
```

Runtime 不直接依赖具体模型供应商。

---

## 15. Infrastructure Layer

负责基础设施适配：

- MySQL Repository
- Redis Client
- Object Storage
- Queue
- WebSocket Gateway
- Command Transport
- Logger
- Config
- External API SDK
- Docker / Deploy

业务规则不能写在 Infrastructure 中。
