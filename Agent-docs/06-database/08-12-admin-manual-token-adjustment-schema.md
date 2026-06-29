# 08-12 Admin Manual Token Adjustment Schema

版本：`v1.5.10`

## 1. 数据库原则

管理员手动增加 Agent Tokens 不新增订单表，不直接修改余额。

它使用已有的：

```text
agent_token_transactions
```

并增强审计能力。

## 2. enum 更新

`AgentTokenTransactionType` 增加：

```prisma
ADMIN_RECHARGE
```

含义：管理员手动给用户增加 Agent Tokens。

## 3. agent_token_transactions 新增字段

```prisma
operatorAdminId String? @map("operator_admin_id") @db.Char(36)
```

用途：记录执行操作的管理员用户 ID。

## 4. 推荐写入示例

```text
type = ADMIN_RECHARGE
direction = CREDIT
amount_tokens = 5000
balance_before = 1200
balance_after = 6200
description = "线下收款充值"
operator_admin_id = admin_user_id
```

## 5. 事务要求

必须在同一个数据库事务内完成：

```text
1. 读取用户当前余额
2. 更新 users.balance_tokens
3. 写 agent_token_transactions
```

如果任一步失败，全部回滚。

## 6. 不创建 recharge_orders

管理员手动充值不是用户发起的订单，因此不写 `recharge_orders`。

## 7. 查询

用户端余额明细：

```text
GET /billing/transactions
```

管理员端查看某用户流水：

```text
GET /studio/users/{id}/transactions
```
