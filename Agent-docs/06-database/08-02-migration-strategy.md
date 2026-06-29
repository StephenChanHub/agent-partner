# 08-02. Migration Strategy

## 1. 原则

从 v1.3 开始：

```text
schema.prisma 是数据库结构的唯一真实来源。
Migration 由 Prisma 自动生成。
不要手写建表 SQL。
```

---

## 2. 初始迁移

后端项目初始化后执行：

```bash
npx prisma migrate dev --name init_v1_3_domain_prisma
```

该迁移应创建：

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

---

## 3. 开发环境

开发环境可以使用：

```bash
npx prisma migrate reset
```

但必须注意：

```text
只允许本地开发数据库 reset。
不要在共享测试库、预生产、生产库执行 reset。
```

---

## 4. 测试环境

测试环境建议：

```bash
npx prisma migrate deploy
```

不要使用：

```bash
npx prisma db push
```

原因：`db push` 不保留可审计 migration 历史。

---

## 5. 生产环境

生产环境只允许：

```bash
npx prisma migrate deploy
```

生产环境禁止：

```text
migrate reset
db push
手动改表
直接改 migration 文件
```

---

## 6. Migration 命名规范

建议命名：

```text
init_v1_3_domain_prisma
add_runtime_event_indexes
add_agent_version_publish_fields
add_device_capabilities
```

命名必须表达业务变化，不要使用：

```text
update1
fix_db
new_schema
```

---

## 7. JSON 字段演进

Manifest、capabilities、payload、slots 等 JSON 字段变化，不一定需要 Migration。

但如果某个 JSON 内字段开始频繁查询、过滤、排序，就应该升级为独立字段。

例如：

```text
agent_versions.manifest.permissions.robot.mobility
```

如果未来需要频繁查询哪些 Agent 支持移动能力，可以新增：

```text
agents.supports_robot_mobility
```

不要在 v1.3 提前增加。

---

## 8. 数据兼容策略

所有新增字段优先设计为：

```text
nullable
有默认值
可回填
```

避免上线时阻塞旧数据。

---

## 9. 回滚策略

Prisma 不鼓励自动回滚生产 migration。

建议：

```text
1. 生产部署前备份数据库
2. 小步 migration
3. 先加字段，再写数据，最后切换逻辑
4. 删除字段必须延后至少一个版本
```

---

## 10. v1.4 前置检查

进入 NestJS Module Skeleton 前，必须完成：

```text
schema.prisma 能通过 prisma generate
migration 能在空 MySQL 库成功执行
seed 能创建默认 Admin、Jarvis Agent、默认 Agent Version
```

Seed 建议在 v1.4 开始补充。


---

## v1.5.4 Usage & Billing Foundation 更新

本版本新增 `usage_records` 表，并在 `users` 表增加 `balance_tokens`、`used_tokens`、`last_seen_at`。V1 只做用量追踪和余额基础，不接支付系统。

核心原则：用量明细进入 `usage_records`，用户快速展示字段保存在 `users`，Robot Action 默认不进入聊天会话，也默认不计费。
