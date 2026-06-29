# 08-01. Prisma Schema Specification

## 1. 目标

本文说明 `schema.prisma` 的设计意图、模型范围和使用规则。

v1.3 的 Prisma Schema 不是临时草稿，而是后端工程初始化的基础。

---

## 2. 文件位置

```text
06-database/schema.prisma
```

后续进入后端仓库时建议移动到：

```text
jarvis-server/gateway/prisma/schema.prisma
```

---

## 3. 数据库选择

v1.3 默认使用 MySQL：

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

本地开发可使用 Docker Compose MySQL。

---

## 4. 命名规范

### 4.1 Prisma Model

使用 PascalCase：

```text
User
Device
Agent
AgentVersion
AgentSession
Message
RuntimeEvent
IntentRecord
ActionRecord
```

### 4.2 数据库表名

使用 snake_case：

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

通过 Prisma `@@map` 统一映射。

---

## 5. ID 策略

v1.3 使用：

```prisma
String @id @default(uuid()) @db.Char(36)
```

说明：

- 开发阶段简单稳定。
- 未来如果要切换 UUID v7 / ULID，可以在工程实现层统一处理。
- 不使用自增 ID，方便多端、分布式、离线设备扩展。

---

## 6. 时间字段

统一使用：

```prisma
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

只读历史表如 `messages`、`runtime_events` 可以只有 `createdAt`。

---

## 7. JSON 字段

v1.3 使用 Prisma `Json` 类型保存可变结构：

```prisma
manifest       Json
capabilities   Json?
metadata       Json?
payload        Json?
slots          Json?
commandPayload Json?
resultPayload  Json?
```

使用原则：

```text
可变配置：JSON
查询过滤：独立字段
外键关系：独立字段
```

---

## 8. 核心约束

必须保留：

```prisma
@@unique([userId, agentId])        // 一个用户 + 一个 Agent 只有一个 Session
@@unique([agentId, version])       // Agent Version 唯一
@@unique([agentId, manifestHash])  // 避免重复 Manifest
@unique runtimeEventId             // 一个 Event 最多一个 Intent Record
```

---

## 9. Runtime 三表说明

### 9.1 RuntimeEvent

所有输入进入 Runtime 的统一入口。

用于：

- 语音输入
- 文本输入
- 设备连接
- 机器人动作结果
- Studio 发布事件

---

### 9.2 IntentRecord

Runtime 对 Event 的结构化理解。

一个 Runtime Event 最多一个 Intent Record。

---

### 9.3 ActionRecord

Runtime 产生的可执行任务。

一个 Runtime Event 可以产生多个 Action Record。

例如：

```text
USER_VOICE
↓
Intent: MOVE
↓
Action 1: ROBOT MOVE
Action 2: VOICE GENERATE_REPLY
Action 3: DEVICE_NOTIFY
```

---

## 10. Prisma 初始化命令

后端仓库中执行：

```bash
npm install prisma @prisma/client
npx prisma init
```

替换生成的 `prisma/schema.prisma`。

设置 `.env`：

```bash
DATABASE_URL="mysql://jarvis:jarvis_password@localhost:3306/jarvis"
```

生成客户端：

```bash
npx prisma generate
```

生成迁移：

```bash
npx prisma migrate dev --name init_v1_3_domain_prisma
```

---

## 11. 不要做的事

v1.3 不要：

```text
手写 CREATE TABLE
为了 Dashboard 页面增加临时字段
把 prompt 拆成独立表
把 skill 拆成独立表
把每个机器人传感器读数写入 MySQL
在 messages 里塞所有 Runtime 过程
```

---

## 12. 下一步

完成 Prisma 后，进入 v1.4：

```text
NestJS Module Skeleton
```

模块必须围绕 Domain 建立，而不是围绕数据库表机械生成。


---

# v1.5.3 更新：长会话轻量记忆字段

为了支持长期 Agent Session，`agent_sessions` 增加 V1 轻量记忆字段：

```text
summary
summary_updated_at
message_count
```

本版本不新增独立 Memory 表，不引入 Embedding 或 Vector Database。完整说明见：

```text
06-database/08-05-runtime-memory-schema.md
```


---

## v1.5.4 Usage & Billing Foundation 更新

本版本新增 `usage_records` 表，并在 `users` 表增加 `balance_tokens`、`used_tokens`、`last_seen_at`。V1 只做用量追踪和余额基础，不接支付系统。

核心原则：用量明细进入 `usage_records`，用户快速展示字段保存在 `users`，Robot Action 默认不进入聊天会话，也默认不计费。

---

## v1.5.5 修正

V1 `schema.prisma` 已删除 `skill_profiles`。

Agent 的人格、能力、行为边界统一放入：

```text
agent_versions.manifest.config.prompt
```

Agent 的照片和视频统一放入：

```text
agent_versions.manifest.social.galleryImages
agent_versions.manifest.social.galleryVideos
```


---

## v1.5.7 Auth 修正

V1 用户注册采用邮箱验证码，验证码存 Redis，不进入 Prisma。

`User` 模型新增：

```prisma
emailVerifiedAt DateTime? @map("email_verified_at")
```

管理员账号 V1 不进入 Prisma，由环境变量提供：

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$12$...
```
