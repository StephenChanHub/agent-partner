# 11-01. NestJS 项目结构规范

> Version: v1.4  
> Purpose: 定义 Jarvis Core 后端工程目录、命名、模块边界和依赖方向。

## 1. 技术选择

Jarvis Core 后端建议采用：

```text
NestJS
TypeScript
Prisma
MySQL
Redis
SSE
WebSocket
JWT
class-validator 或 Zod
```

v1.4 阶段只建立骨架，不接真实 LLM、TTS、硬件。

---

## 2. 为什么采用 Modular Monolith

Jarvis 当前不适合一开始拆微服务。

原因：

- 团队规模还小。
- Domain 仍在快速演进。
- Runtime / Agent / Device / Robot 强耦合于同一个用户请求链路。
- 微服务会提前引入网络、部署、观测、事务复杂度。

推荐形态：

```text
单仓库
单 NestJS 应用
多 Domain Module
Infrastructure Adapter 可替换
```

后续如果规模扩大，再拆：

```text
Core API
Runtime Worker
Device Gateway
Studio Admin
```

---

## 3. 根目录结构

```text
jarvis-core/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   ├── config/
│   ├── infrastructure/
│   └── modules/
└── test/
```

---

## 4. src 目录结构

```text
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── constants/
│   ├── decorators/
│   ├── errors/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── types/
│   └── utils/
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── llm.config.ts
│   ├── redis.config.ts
│   └── voice.config.ts
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

## 5. 模块内部结构

标准 CRUD / Application 模块：

```text
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.repository.ts
├── dto/
├── types/
└── __tests__/
```

Runtime 模块更复杂，允许内部二级引擎：

```text
runtime/
├── runtime.module.ts
├── runtime.controller.ts
├── runtime.service.ts
├── event/
├── context/
├── intent-engine/
├── dispatcher/
├── chat-engine/
├── robot-engine/
├── system-engine/
├── skill-engine/
├── voice-engine/
├── dto/
└── types/
```

---

## 6. 命名规范

### 文件命名

```text
kebab-case
```

示例：

```text
agent-session.service.ts
create-agent-session.dto.ts
runtime-context.builder.ts
```

### 类命名

```text
PascalCase
```

示例：

```ts
AgentSessionsService
CreateAgentSessionDto
RuntimeContextBuilder
```

### 方法命名

```text
camelCase
```

示例：

```ts
findOrCreate()
getRecentMessages()
dispatchAction()
```

---

## 7. 依赖方向

允许：

```text
Controller → Service
Service → Repository
Service → Infrastructure Port
Repository → Prisma Service
Runtime Service → Domain Services
Runtime Engine → Infrastructure Port
```

禁止：

```text
Controller → Prisma
Controller → Gemini SDK
Controller → ElevenLabs SDK
Service → HTTP Request Object
Repository → Business Decision
Infrastructure Adapter → Domain Service
```

---

## 8. 模块依赖建议

```text
auth
├── users
└── devices

runtime
├── agents
├── agent-sessions
├── messages
├── devices
├── robot
└── infrastructure ports

studio
├── agents
└── auth/admin guard

robot
├── devices
└── infrastructure/robot-transport
```

---

## 9. 环境变量规范

`.env.example` 必须包含：

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/jarvis
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
DEVICE_TOKEN_SECRET=change_me
```

敏感值不得写入文档或代码仓库。

---

## 10. v1.4 验收标准

```text
项目可以 npm run start:dev
AppModule 可以加载所有模块
模块 import 不出现循环依赖
Prisma schema 位于 prisma/schema.prisma
Runtime 目录结构完整
Infrastructure Port 接口存在
```

---

## v1.5.5 修正

V1 后端结构移除：

```text
src/modules/skill-profiles
```

V1 Agent 配置由 `agents` / `agent_versions` 模块负责，具体人设和能力写入 `manifest.config.prompt`。
