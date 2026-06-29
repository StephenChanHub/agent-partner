# 04-10 Admin Manual Token Adjustment Model

版本：`v1.5.10`

## 1. 背景

V1 暂不接真实支付。用户真正运营时可能通过线下收款、内测赠送、问题补偿等方式获得 Agent Tokens。

因此管理员端必须具备一个轻量但可审计的能力：

```text
给用户增加 Agent Tokens
```

## 2. 核心原则

```text
余额只是结果。
流水才是真相。
```

任何余额变化都不能只改 `users.balance_tokens`。

正确流程：

```text
管理员提交增加 Tokens
↓
校验 ADMIN 权限
↓
校验 amount 和 reason
↓
开启数据库事务
↓
读取用户当前余额
↓
更新 users.balance_tokens
↓
写 agent_token_transactions
↓
写操作日志
↓
返回最新余额
```

## 3. 管理员手动充值不是订单

V1 明确区分：

```text
用户自己点击充值套餐创建的记录 = recharge_orders
管理员人工增加余额 = agent_token_transactions
```

管理员手动充值不创建 `recharge_orders`，避免污染订单语义。

它写入：

```text
agent_token_transactions.type = ADMIN_RECHARGE
agent_token_transactions.direction = CREDIT
```

## 4. 余额流水类型

V1 余额流水至少包括：

```text
RECHARGE        用户订单支付成功
USAGE           对话扣费
ADMIN_RECHARGE  管理员手动充值
ADMIN_ADJUST    未来预留的管理员调整
REFUND          未来退款
GIFT            未来赠送
```

## 5. V1 页面只开放增加

虽然数据模型保留 `CREDIT / DEBIT`，但 V1 管理员页面只开放：

```text
增加 Agent Tokens
```

暂不开放扣减，降低误操作风险。

## 6. 审计字段

管理员手动充值必须记录：

```text
operator_admin_id
reason / description
amount_tokens
balance_before
balance_after
created_at
```

## 7. 用户体验

用户端余额明细中可以看到：

```text
管理员充值 +5000 Agent Tokens
```

但它不会出现在充值订单列表中。

## 8. 管理员体验

管理员用户管理页应显示：

```text
用户邮箱
昵称
余额
已用 Tokens
最后上线时间
增加 Tokens 按钮
余额流水
充值订单
```
