# Prisma and Redis Adapter v1.5

## 1. 目标

Jarvis Core 同时需要长期数据和实时状态。

```text
MySQL / Prisma：长期数据
Redis / Memory Cache：实时数据
```

---

## 2. Prisma 负责什么

```text
users
agents
agent_versions
agent_sessions
messages
runtime_events
intent_records
action_records
devices
```

Prisma 只负责持久化数据，不负责实时在线状态。

---

## 3. Redis 负责什么

```text
device:online:{deviceId}
device:status:{deviceId}
runtime:stream:{eventId}
action:pending:{actionId}
rate-limit:{userId}
ws:connection:{deviceId}
```

Redis 保存的是可以丢失、可以重建的状态。

---

## 4. Cache Port

```typescript
export interface CachePort {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

---

## 5. Redis Key 命名规范

```text
jarvis:{env}:{domain}:{resource}:{id}
```

示例：

```text
jarvis:dev:device:online:device_123
jarvis:dev:runtime:stream:event_456
jarvis:prod:action:pending:action_789
```

---

## 6. TTL 规范

| Key | TTL | 说明 |
|---|---:|---|
| device online | 90s | 依赖 heartbeat 刷新 |
| device status | 120s | 状态快照 |
| runtime stream | 10min | 流式输出临时缓存 |
| action pending | 5min | 未完成动作 |
| rate limit | 60s | 简单限流窗口 |

---

## 7. Repository 与 Prisma 的关系

业务模块不能直接散落调用 Prisma。

推荐：

```text
Service
↓
Repository
↓
PrismaService
```

例如：

```typescript
@Injectable()
export class AgentSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserAndAgent(userId: string, agentId: string) {
    return this.prisma.agentSession.findUnique({
      where: { userId_agentId: { userId, agentId } },
    });
  }
}
```

---

## 8. 本地开发策略

本地最小启动可以不依赖 Redis：

```env
CACHE_DRIVER=memory
```

联调设备或 WebSocket 时再使用：

```env
CACHE_DRIVER=redis
```
