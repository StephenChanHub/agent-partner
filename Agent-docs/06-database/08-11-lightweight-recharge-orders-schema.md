# Lightweight Recharge Orders Schema v1.5.9

## 1. 新增表

v1.5.9 新增两张表：

```text
recharge_orders
agent_token_transactions
```

数据库从 13 张核心表扩展为 15 张。

## 2. recharge_orders

职责：记录用户充值订单。

核心字段：

```text
id
order_no
user_id
amount_rmb
currency
agent_tokens
status
payment_provider
payment_method
payment_trade_no
payment_payload
expires_at
paid_at
created_at
updated_at
```

V1 状态：

```text
PENDING
PAID
EXPIRED
```

## 3. agent_token_transactions

职责：记录 Agent Tokens 余额变化流水。

核心字段：

```text
id
user_id
type
direction
amount_tokens
balance_before
balance_after
related_order_id
related_usage_record_id
description
metadata
created_at
```

## 4. 为什么不能只用 users.balance_tokens

`users.balance_tokens` 是当前余额快照。

`agent_token_transactions` 是余额变化历史。

没有流水就无法解释：

```text
余额为什么增加？
余额为什么减少？
用户充值是否到账？
某次对话扣了多少钱？
管理员是否手动调整过？
```

## 5. 支付成功事务

支付成功必须在同一个数据库事务中完成：

```text
1. 查询订单并锁定
2. 校验状态为 PENDING
3. 校验未过期
4. 更新订单为 PAID
5. 更新 users.balance_tokens
6. 写入 agent_token_transactions
7. 提交事务
```

## 6. 对话扣费事务

对话扣费时：

```text
1. 写 usage_records
2. 扣 users.balance_tokens
3. 增加 users.used_tokens
4. 写 agent_token_transactions，type=USAGE，direction=DEBIT
```

V1 可以先在业务层保证顺序，后续进入强事务化实现。

## 7. 过期订单

V1 不需要 cron。

查询用户充值记录时：

```text
PENDING 且 expires_at <= now
↓
更新为 EXPIRED
↓
不返回给用户端
```

管理员端可以查看 EXPIRED。

---

# v1.5.10 Update：Admin Manual Recharge

管理员手动增加 Agent Tokens 不创建 `recharge_orders`。

它写入 `agent_token_transactions`：

```text
type = ADMIN_RECHARGE
direction = CREDIT
operator_admin_id = 当前管理员 ID
```

`recharge_orders` 继续只表达用户自己发起的充值订单。
