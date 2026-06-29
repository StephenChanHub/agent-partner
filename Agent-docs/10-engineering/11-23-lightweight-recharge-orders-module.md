# Lightweight Recharge Orders Module v1.5.9

## 1. 模块目标

新增 Billing / Recharge 模块，负责 V1 轻量充值订单和余额流水。

```text
BillingModule
├── RechargeOrderService
├── AgentTokenTransactionService
├── RechargePackageService
├── MockPaymentService
└── repositories
```

## 2. 职责

```text
创建充值订单
查询充值记录
处理过期订单
Mock 支付成功
增加用户余额
写余额流水
查询余额流水
管理员查看订单与流水
管理员调整余额
```

## 3. 不负责

```text
真实微信支付
真实支付宝支付
支付回调验签
发票
退款
优惠券
复杂套餐管理
```

## 4. 推荐目录

```text
src/modules/billing/
├── billing.module.ts
├── billing.controller.ts
├── billing.service.ts
├── recharge-order.service.ts
├── recharge-package.service.ts
├── agent-token-transaction.service.ts
├── mock-payment.service.ts
├── dto/
│   ├── create-recharge-order.dto.ts
│   ├── recharge-order-query.dto.ts
│   └── transaction-query.dto.ts
└── repositories/
    ├── recharge-order.repository.ts
    └── agent-token-transaction.repository.ts
```

## 5. 支付成功流程

```text
MockPaymentService.pay(orderId)
↓
RechargeOrderService.markPaid(orderId)
↓
数据库事务：
  - 校验订单 PENDING
  - 校验未过期
  - 更新订单 PAID
  - 增加用户 balance_tokens
  - 写 AgentTokenTransaction CREDIT / RECHARGE
```

## 6. 查询订单时处理过期

V1 可以不做定时任务。

```text
查询用户订单前
↓
把当前用户已过期 PENDING 订单更新为 EXPIRED
↓
返回 PAID + 未过期 PENDING
```

## 7. Usage 扣费接入

Usage 扣费应调用 AgentTokenTransactionService 写流水。

```text
UsageMeterService
↓
UsageRecord
↓
AgentTokenTransaction DEBIT / USAGE
```

这样充值和消费都进入统一账本。

## 8. 幂等

Mock 支付接口必须幂等：

```text
订单已经 PAID：直接返回已支付，不重复加余额
订单 EXPIRED：拒绝支付
订单 PENDING：执行支付成功
```
