# 11-24 Admin Manual Token Adjustment Module

版本：`v1.5.10`

## 1. 模块归属

管理员入口属于 Studio，但账务执行必须属于 Billing。

推荐结构：

```text
Studio Controller
↓
Billing / AdminTokenAdjustmentService
↓
AgentTokenTransactionRepository
↓
Prisma Transaction
```

## 2. 后端骨架

```text
src/modules/billing/
├── admin-token-adjustment.service.ts
├── studio-billing.controller.ts
├── dto/admin-adjust-agent-tokens.dto.ts
└── repositories/agent-token-transaction.repository.ts
```

## 3. 服务职责

`AdminTokenAdjustmentService` 负责：

```text
校验用户存在
校验 amount > 0
校验 reason 必填
校验单次上限
开启事务
更新 users.balance_tokens
写 agent_token_transactions
返回最新余额
```

## 4. 禁止事项

```text
Controller 禁止直接调用 Prisma 更新 users.balance_tokens。
UsageService 禁止直接修改余额。
MockPaymentService 禁止跳过流水。
任何余额变化必须通过统一 Transaction Service。
```

## 5. 环境变量

```env
ADMIN_TOKEN_ADJUST_MAX_AMOUNT=100000
```

## 6. v1.6 Mock API 要求

v1.6 Mock API 必须模拟：

```text
POST /studio/users/{id}/tokens/adjust
返回 balanceBefore / balanceAfter / transactionId
刷新用户余额
刷新 transaction list
```
