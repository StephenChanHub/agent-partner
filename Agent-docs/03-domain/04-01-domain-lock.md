# 04-01. Domain Lock v1.3

## 1. 目的

v1.3 的 Domain Lock 用来冻结 Jarvis 进入工程开发前的核心领域边界。

它回答三个问题：

```text
1. Jarvis 里哪些对象是长期稳定的业务对象？
2. Runtime 如何处理聊天、设备、机器人动作、系统事件？
3. 哪些对象现在必须建表，哪些只做未来预留？
```

---

## 2. 为什么不能直接从 API 反推 Prisma

团队流程中提到：

```text
API → Prisma
```

这个方向适合普通 Web CRUD 项目，但不完全适合 Jarvis。

Jarvis 的正确关系是：

```text
Domain Model
├── API Contract
└── Prisma Schema
```

原因：

- API 负责多端通信契约。
- Prisma 负责数据持久化。
- Runtime 负责执行流程。
- 三者必须共同服务同一个 Domain Model。

如果让 API 单独决定 Prisma，数据库会倾向于“接口形状”，而不是“业务真实世界”。

---

## 3. 已冻结 Product Domain

v1.3 冻结以下 Product Domain：

```text
User
Device
Agent
Agent Version
Agent Session
Message
```

这些对象进入 Prisma Schema。

---

## 4. 已冻结 Runtime Domain

v1.3 新增冻结以下 Runtime Domain：

```text
Runtime Event
Intent Record
Action Record
```

这三个对象解决 Jarvis 从“聊天服务”升级到“任务调度系统”的问题。

```text
Input
↓
Runtime Event
↓
Intent Engine
↓
Intent Record
↓
Task Dispatcher
↓
Action Record
↓
Chat / Robot / System / Skill Engine
```

---

## 5. 不进入 v1.3 的对象

以下对象先不建表：

```text
Workspace
Memory
Embedding
Tool Call
Skill Registry
Robot Map
Robot Pose
Sensor Frame
Planner Step
Analytics Event
Audit Log
```

说明：

- `Workspace` 用 `users.current_session_id` 替代。
- `Memory` 先从最近 messages 和未来 summary 逐步演进。
- `Tool Call` 等 Skill Engine 进入真实开发时再拆。
- Robot Map / Sensor Frame / Planner Step 属于 V3 复杂机器人能力。

---

## 6. Prisma 建表范围

v1.3 最终建表：

```text
users
devices
agents
agent_versions
agent_sessions
messages
runtime_events
intent_records
action_records
```

这是当前最小但可扩展的生产级数据模型。

---

## 7. 领域边界

### 7.1 Controller 边界

Controller 只负责：

```text
认证
解析参数
调用 Application Service
返回 DTO
```

Controller 不做：

```text
Intent 判断
Prompt 拼装
Robot Command 生成
数据库事务编排
```

---

### 7.2 Runtime 边界

Runtime 只处理：

```text
Runtime Event
Intent
Action
Context
Engine Dispatch
```

Runtime 不直接暴露 HTTP 细节。

---

### 7.3 Device 边界

Device 只负责：

```text
录音
播放音频
展示状态
上报能力
执行经过安全检查的命令
```

Device 不负责：

```text
Prompt
Agent 配置
长期 Memory
LLM 调用
Studio 发布
```

---

### 7.4 Robot Engine 边界

Robot Engine 只负责把 Intent 转成标准 Robot Action。

它不直接控制电机。

```text
Robot Engine
↓
Action Record
↓
Device Command
↓
Device Local Safety Check
↓
Motor / Servo / Leg Driver
```

---

## 8. Domain Lock 结论

v1.3 的核心不是多建几张表，而是确立：

```text
Jarvis Core = Event-driven Runtime + Agent Platform
```

这个结论会指导 v1.4 NestJS Module Skeleton。
