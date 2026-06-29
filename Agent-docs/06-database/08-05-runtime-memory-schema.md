# Runtime Memory Schema v1.5.3

## 1. 目标

本版本采用 V1 轻量化记忆策略。

目标不是做完整 Memory System，而是让长会话具备基本连续性：

```text
Agent Session Summary
Recent Messages
Compiled Agent Prompt
```

## 2. 数据库变化

只修改 `agent_sessions` 表，新增三个字段：

```prisma
summary          String?   @db.LongText
summaryUpdatedAt DateTime? @map("summary_updated_at")
messageCount     Int      @default(0) @map("message_count")
```

## 3. 为什么不新增 Memory 表

V1 暂不新增：

```text
session_memories
memory_items
embeddings
vector_index
user_memory_profile
```

原因：

```text
1. 当前产品还未进入复杂个人长期记忆阶段
2. 先保证 Agent Session 长会话可用
3. 避免 Prisma 和 API 过早复杂化
4. 降低 v1.6 Mock API 和后端实现难度
```

## 4. 更新策略

`message_count` 每新增一条 message 增加 1。

当满足以下任一条件时，触发 Summary 更新：

```text
message_count % 20 == 0
recent messages 超过 token 预算
用户主动要求总结
系统进入阶段切换
```

## 5. 查询策略

每次 Runtime Context 构建时读取：

```text
agent_sessions.summary
agent_sessions.message_count
agent_sessions.summary_updated_at
最近 N 条 messages
```

## 6. Migration 建议

Prisma migration 命名：

```text
2026xxxxxx_add_agent_session_summary_fields
```

SQL 语义：

```sql
ALTER TABLE agent_sessions
  ADD COLUMN summary LONGTEXT NULL,
  ADD COLUMN summary_updated_at DATETIME NULL,
  ADD COLUMN message_count INT NOT NULL DEFAULT 0;
```

## 7. 未来扩展

V2 如果需要更强记忆，再增加：

```text
session_memories
memory_items
memory_embeddings
memory_policies
```

但必须在 V1 长会话跑通后再做。
