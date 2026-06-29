# 11-05. Prisma Repository Pattern

> Version: v1.4  
> Purpose: 定义 Prisma 在 Jarvis Core 中的使用边界。

## 1. 核心原则

`schema.prisma` 是数据库模型的唯一真实来源。

但 Prisma Client 不应该在整个项目中到处出现。

允许：

```text
Repository → PrismaService
```

禁止：

```text
Controller → PrismaService
Runtime Engine → PrismaService
Infrastructure Adapter → PrismaService
```

---

## 2. Prisma Infrastructure 目录

```text
infrastructure/database/
├── database.module.ts
├── prisma.service.ts
└── prisma.types.ts
```

### PrismaService

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

## 3. Repository 的职责

Repository 只做：

```text
find
create
update
delete / archive
transaction
query composition
```

Repository 不做：

```text
权限判断
Intent 判断
Robot Safety
Prompt Builder
调用 LLM
调用 TTS
```

---

## 4. 推荐 Repository 列表

```text
users.repository.ts
agents.repository.ts
agent-sessions.repository.ts
messages.repository.ts
devices.repository.ts
runtime-events.repository.ts
intent-records.repository.ts
action-records.repository.ts
studio.repository.ts
```

---

## 5. Agent Session Repository

```ts
@Injectable()
export class AgentSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserAndAgent(userId: string, agentId: string) {
    return this.prisma.agentSession.findUnique({
      where: {
        userId_agentId: { userId, agentId },
      },
    });
  }

  create(input: { userId: string; agentId: string; agentVersionId?: string }) {
    return this.prisma.agentSession.create({ data: input });
  }

  updateLastMessageAt(sessionId: string) {
    return this.prisma.agentSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    });
  }
}
```

---

## 6. Messages Repository

```ts
@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateMessageInput) {
    return this.prisma.message.create({ data: input });
  }

  listBySession(sessionId: string, cursor?: string, limit = 20) {
    return this.prisma.message.findMany({
      where: { agentSessionId: sessionId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  getRecent(sessionId: string, limit = 20) {
    return this.prisma.message.findMany({
      where: { agentSessionId: sessionId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
```

---

## 7. Runtime Records Repository

Runtime 需要三个持久化对象：

```text
runtime_events
intent_records
action_records
```

建议拆成三个 Repository，避免一个 RuntimeRepository 过大。

```text
runtime-events.repository.ts
intent-records.repository.ts
action-records.repository.ts
```

### Action Records

```ts
@Injectable()
export class ActionRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateActionRecordInput) {
    return this.prisma.actionRecord.create({ data: input });
  }

  markDispatched(id: string) {
    return this.prisma.actionRecord.update({
      where: { id },
      data: { status: 'DISPATCHED', dispatchedAt: new Date() },
    });
  }

  markSucceeded(id: string, result?: Json) {
    return this.prisma.actionRecord.update({
      where: { id },
      data: { status: 'SUCCEEDED', result, completedAt: new Date() },
    });
  }

  markFailed(id: string, error: Json) {
    return this.prisma.actionRecord.update({
      where: { id },
      data: { status: 'FAILED', error, completedAt: new Date() },
    });
  }
}
```

---

## 8. Transaction 原则

只有 Application Service 可以决定事务边界。

示例：

```text
保存用户消息
↓
创建 Runtime Event
↓
更新 Agent Session last_message_at
```

可以放入一个事务。

但：

```text
调用 LLM
调用 TTS
下发 Robot Command
```

不得放进数据库事务。

---

## 9. 查询优化原则

V1 只建立必要索引：

```text
user_id
agent_id
agent_session_id
status
created_at
last_message_at
device_id
runtime_event_id
```

不要为了未来分析提前建立复杂索引。

---

## 10. v1.4 验收标准

```text
PrismaService 设计明确
DatabaseModule 设计明确
Repository 访问边界明确
Runtime Records Repository 明确
事务边界明确
Controller 禁止直接访问 Prisma
```
