# 11. 后端模块规范

> Version: v1.4  
> Status: Backend Module Skeleton Frozen Draft

## 1. 后端设计目标

Jarvis Core 的后端不是普通 CRUD 服务，而是一个 **AI Runtime + Agent Platform + Device Gateway + Robot Command Dispatcher**。

v1.4 的目标不是立即实现完整业务，而是先把 NestJS 后端骨架搭成长期可维护的形态：

```text
API Layer
↓
Application / Domain Module
↓
Runtime Engines
↓
Infrastructure Ports
↓
Adapters
```

核心原则：

- 按领域模块拆分，不按技术文件夹堆叠。
- Controller 只负责 HTTP 输入输出，不写业务逻辑。
- Service 负责业务流程，不直接访问外部供应商。
- Repository 负责数据访问，不出现在 Controller。
- Runtime 是协调者，不是 CRUD 模块。
- Infrastructure 通过 Port / Adapter 接入。
- Robot 能力从一开始进入模块骨架，但不接真实硬件。

---

## 2. 推荐后端目录

```text
jarvis-core/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── prisma/
│   └── schema.prisma
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── common/
    │   ├── decorators/
    │   ├── filters/
    │   ├── guards/
    │   ├── interceptors/
    │   ├── pipes/
    │   ├── types/
    │   └── utils/
    ├── config/
    ├── infrastructure/
    │   ├── cache/
    │   ├── database/
    │   ├── device-gateway/
    │   ├── llm/
    │   ├── logger/
    │   ├── robot-transport/
    │   ├── stt/
    │   └── tts/
    └── modules/
        ├── auth/
        ├── users/
        ├── agents/
        ├── agent-sessions/
        ├── messages/
        ├── runtime/
        ├── devices/
        ├── robot/
        ├── studio/
        └── system/
```

---

## 3. 模块清单

| Module | 类型 | 职责 |
|---|---|---|
| `auth` | Application | 注册、登录、JWT、Refresh、Device Token |
| `users` | Application | 用户资料、当前 Agent Session |
| `agents` | Application | Published Agent 查询、Manifest 加载 |
| `agent-sessions` | Application | 用户与 Agent 的长期空间 |
| `messages` | Application | 消息存储、分页读取、上下文读取 |
| `runtime` | Runtime | Event → Intent → Action → Response |
| `devices` | Application | 设备绑定、连接、心跳、状态 |
| `robot` | Runtime/Application | Robot Command、Safety、Action Tracking |
| `studio` | Admin Application | Agent Draft、Version、Publish |
| `system` | Application | 电量、服务健康、系统状态查询 |

---

## 4. Auth Module

### 职责

```text
注册
登录
JWT 签发
Refresh Token
Admin Guard
User Guard
Device Auth Guard
```

### API

```text
POST /auth/email-code/send
POST /auth/register
POST /auth/login
POST /auth/refresh
GET /me
```

### 推荐目录

```text
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── refresh-token.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── admin.guard.ts
│   └── device-auth.guard.ts
└── strategies/
    └── jwt.strategy.ts
```

### Service 方法

```ts
register(input: RegisterDto): Promise<AuthResult>
login(input: LoginDto): Promise<AuthResult>
refresh(refreshToken: string): Promise<AuthResult>
validateUser(userId: string): Promise<AuthUser>
validateDeviceToken(token: string): Promise<DeviceAuthContext>
```

---

## 5. Users Module

### 职责

```text
用户资料
当前 Agent Session
用户偏好
账号状态
```

### API

```text
GET /users/me
PATCH /users/me
GET /users/me/current-session
PATCH /users/me/current-session
```

### Service 方法

```ts
getProfile(userId: string): Promise<UserProfile>
updateProfile(userId: string, input: UpdateProfileDto): Promise<UserProfile>
setCurrentSession(userId: string, agentSessionId: string): Promise<void>
getCurrentSession(userId: string): Promise<AgentSessionSummary | null>
```

---

## 6. Agents Module

### 职责

```text
查询已发布 Agent
读取 Agent Manifest
读取当前发布版本
为 Runtime 提供 Manifest Snapshot
```

### API

```text
GET /agents
GET /agents/:slug
GET /agents/:slug/manifest
```

### Service 方法

```ts
listPublishedAgents(): Promise<AgentSummary[]>
getAgentBySlug(slug: string): Promise<AgentDetail>
getPublishedManifest(agentId: string): Promise<AgentManifestSnapshot>
```

### 注意

`agents` 模块只读取 Published Agent。Draft、Publish、Version 操作属于 `studio` 模块。

---

## 7. Agent Sessions Module

### 职责

```text
查询或创建 Agent Session
保证一个用户对一个 Agent 只有一个 Session
归档 Session
校验 Session 归属
更新 last_message_at
```

### API

```text
GET /agent-sessions
POST /agent-sessions
GET /agent-sessions/:id
PATCH /agent-sessions/:id/archive
```

### Service 方法

```ts
findOrCreate(userId: string, agentId: string): Promise<AgentSession>
listByUser(userId: string): Promise<AgentSessionSummary[]>
getById(userId: string, sessionId: string): Promise<AgentSessionDetail>
archive(userId: string, sessionId: string): Promise<void>
assertOwnership(userId: string, sessionId: string): Promise<void>
updateLastMessageAt(sessionId: string): Promise<void>
```

---

## 8. Messages Module

### 职责

```text
保存用户消息
保存助手消息
保存系统消息
保存 Robot / Device / Skill 反馈 metadata
分页读取消息
读取最近上下文消息
```

### API

```text
GET /agent-sessions/:sessionId/messages
POST /agent-sessions/:sessionId/messages
```

### Service 方法

```ts
createUserMessage(sessionId: string, content: string, metadata?: Json): Promise<Message>
createAssistantMessage(sessionId: string, content: string, metadata?: Json): Promise<Message>
createSystemMessage(sessionId: string, content: string, metadata?: Json): Promise<Message>
listMessages(sessionId: string, cursor?: string, limit?: number): Promise<PaginatedMessages>
getRecentMessages(sessionId: string, limit: number): Promise<Message[]>
```

---

## 9. Runtime Module

Runtime 是 Jarvis Core 的执行中心。

### 职责

```text
接收 Runtime Event
构建 Runtime Context
调用 Intent Engine
调用 Task Dispatcher
分发 Chat / Robot / System / Skill / Voice Action
保存 Runtime Event / Intent Record / Action Record
返回 SSE / JSON / WebSocket Command
```

### API

```text
POST /runtime/events
POST /runtime/chat
POST /runtime/voice
```

### 推荐目录

```text
runtime/
├── runtime.module.ts
├── runtime.controller.ts
├── runtime.service.ts
├── event/
│   ├── runtime-event.factory.ts
│   ├── runtime-event-recorder.service.ts
│   └── runtime-event.types.ts
├── context/
│   ├── runtime-context.builder.ts
│   └── runtime-context.types.ts
├── intent-engine/
│   ├── intent-engine.service.ts
│   ├── rule-intent-classifier.service.ts
│   └── llm-intent-classifier.service.ts
├── dispatcher/
│   ├── task-dispatcher.service.ts
│   └── action-router.service.ts
├── chat-engine/
│   ├── chat-engine.service.ts
│   ├── prompt-builder.service.ts
│   └── stream-response.service.ts
├── robot-engine/
│   ├── robot-engine.service.ts
│   └── robot-action-mapper.service.ts
├── system-engine/
│   └── system-engine.service.ts
├── skill-engine/
│   └── skill-engine.service.ts
├── voice-engine/
│   └── voice-engine.service.ts
├── dto/
└── types/
```

### Runtime 主流程

```text
HTTP / Voice / Device Input
↓
Runtime Event Factory
↓
Runtime Context Builder
↓
Intent Engine
↓
Task Dispatcher
├── Chat Engine
├── Robot Engine
├── System Engine
├── Skill Engine
└── Voice Engine
↓
Action Record
↓
Response / SSE / WebSocket Command
```

---

## 10. Devices Module

### 职责

```text
设备绑定
设备连接
设备心跳
设备状态
设备能力上报
设备 Token 校验
```

### API

```text
POST /devices/pairing/start
POST /devices/pairing/confirm
POST /devices/connect
POST /devices/heartbeat
GET /devices
GET /devices/:id
```

### Service 方法

```ts
startPairing(userId: string): Promise<PairingSession>
confirmPairing(userId: string, code: string): Promise<DeviceTokenResult>
connect(input: DeviceConnectDto): Promise<DeviceConnectionResult>
heartbeat(deviceId: string, input: HeartbeatDto): Promise<void>
listUserDevices(userId: string): Promise<DeviceSummary[]>
updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<void>
```

---

## 11. Robot Module

### 职责

```text
Robot Action 校验
Robot Safety Policy
Robot Command Envelope 构建
Robot Action 状态跟踪
Robot Command Transport 调用
```

### API

```text
POST /robot/actions
GET /robot/actions/:id
POST /robot/actions/:id/cancel
```

### Service 方法

```ts
createRobotAction(userId: string, input: RobotActionDto): Promise<ActionRecord>
validateSafety(input: RobotActionDto, context: RobotContext): Promise<SafetyResult>
dispatchToDevice(action: ActionRecord): Promise<void>
markActionSucceeded(actionId: string, result: Json): Promise<void>
markActionFailed(actionId: string, reason: string): Promise<void>
cancelAction(actionId: string): Promise<void>
```

### 注意

v1.4 不接真实电机，Robot Module 只负责软件层命令封装。

---

## 12. Studio Module

### 职责

```text
创建 Agent Draft
编辑 Manifest
创建 Agent Version
Publish
Rollback
Archive
```

### API

```text
GET /studio/agents
POST /studio/agents
GET /studio/agents/:id
PATCH /studio/agents/:id
POST /studio/agents/:id/publish
POST /studio/agents/:id/rollback
```

### Service 方法

```ts
createDraft(adminId: string, input: CreateAgentDto): Promise<AgentDraft>
updateManifest(adminId: string, agentId: string, input: UpdateManifestDto): Promise<AgentDraft>
publish(adminId: string, agentId: string): Promise<AgentVersion>
rollback(adminId: string, agentId: string, versionId: string): Promise<AgentVersion>
archive(adminId: string, agentId: string): Promise<void>
```

---

## 13. System Module

### 职责

```text
健康检查
系统状态
设备电量查询
Core Version
Infrastructure 状态聚合
```

### API

```text
GET /health
GET /system/status
```

---

## 14. Common Module

Common 不是业务模块，只放横切能力：

```text
异常过滤器
响应拦截器
分页 DTO
鉴权装饰器
当前用户装饰器
Zod / class-validator 管道
错误码
基础类型
```

禁止把业务逻辑放入 `common`。

---

## 15. v1.4 完成标准

v1.4 完成时，后端应该满足：

```text
NestJS 项目可启动
所有模块目录存在
所有 Controller / Service / DTO 骨架存在
Prisma schema 放入 prisma/
Runtime Pipeline 类型存在
Infrastructure Port 接口存在
Robot Module 存在但不接硬件
单元测试目录存在
Mock API 可在 v1.6 接入
```

不要求：

```text
真实数据库查询完整实现
真实 Gemini 调用
真实 ElevenLabs 调用
真实电机控制
完整权限系统
完整 Studio 页面
```


# v1.5.1 补充：Model Profiles 与 Voice Profiles 模块

Backend Module Skeleton 新增：

```text
model-profiles
voice-profiles
```

这两个模块既服务于 Studio UI，也服务于 Runtime Profile Resolve。

它们不应该作为 `studio` 子目录实现，因为 Runtime 需要在聊天和语音回复链路中读取它们。

详细模块规范见：`10-engineering/11-16-studio-resource-library-modules.md`。

---

## v1.5.5 修正：Agent Config Simplification

V1 Backend Module 不实现 SkillProfilesModule。

Agent 的 Persona、Capability、Tool 描述和 Behavior 边界统一读取：

```text
AgentVersion.manifest.config.prompt
```

Agent 的图片和视频展示统一读取：

```text
AgentVersion.manifest.social.galleryImages
AgentVersion.manifest.social.galleryVideos
```

Runtime V1 只需要完成文字聊天和语音聊天，不执行真实工具调用。


---

## v1.5.7 修正：Email Registration & Single Admin

Auth Module V1 范围正式锁定：

```text
普通用户：邮箱验证码注册 + 邮箱密码登录
验证码：Redis TTL，不进 MySQL
管理员：后端唯一账号，环境变量配置，bcrypt hash 校验
```

Auth Module 新增服务：

```text
EmailCodeService
AdminAuthService
```

Auth Module 新增接口：

```text
POST /auth/email-code/send
```
