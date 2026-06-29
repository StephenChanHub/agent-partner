# 07-14 Admin Manual Token Adjustment API

版本：`v1.5.10`

## 1. 新增接口

```http
POST /studio/users/{id}/tokens/adjust
```

用途：管理员手动给用户增加 Agent Tokens。

## 2. 权限

```text
仅 ADMIN 可调用。
普通用户不可调用。
```

## 3. 请求

```json
{
  "amountAgentTokens": 5000,
  "reason": "线下收款充值"
}
```

字段规则：

```text
amountAgentTokens: 必填，正整数
reason: 必填，建议 2～255 字符
```

## 4. 响应

```json
{
  "userId": "user_xxx",
  "balanceBefore": 1200,
  "amountAgentTokens": 5000,
  "balanceAfter": 6200,
  "transactionId": "txn_xxx"
}
```

## 5. 错误

```text
401 未登录
403 非管理员
400 amount 非法或 reason 缺失
400 超过单次管理员增加上限
404 用户不存在
```

## 6. 重要规则

```text
禁止只改 users.balance_tokens。
接口必须通过 Billing / Transaction Service 执行。
接口必须写 agent_token_transactions。
接口必须记录 operator_admin_id。
接口必须在数据库事务中执行。
```

## 7. 与旧接口的关系

历史文档中的：

```http
POST /studio/users/{id}/balance/adjust
```

从 v1.5.10 起标记为 deprecated。

正式使用：

```http
POST /studio/users/{id}/tokens/adjust
```
