# Wallet Recharge Orders UI v1.5.9

## 1. 页面定位

V1 用户端需要一个轻量的钱包页面：

```text
Wallet / Recharge
```

它同时承担：

```text
充值页面
充值记录页面
余额展示页面
```

## 2. 页面结构

```text
Wallet / Recharge
├── 当前余额
├── 充值套餐
├── 充值说明
└── 充值记录
```

## 3. 当前余额

展示：

```text
当前余额：8600 Agent Tokens
约等于：8.6 RMB
```

说明：

```text
1 RMB = 1000 Agent Tokens
文字聊天按大模型 tokens 计费
语音聊天会额外按语音字符数计费
```

## 4. 充值套餐

V1 套餐：

```text
¥5   5000 Agent Tokens
¥10  10000 Agent Tokens
¥30  30000 Agent Tokens
¥50  50000 Agent Tokens
¥100 100000 Agent Tokens
```

V1 不做优惠，不做优惠券。

## 5. 创建订单

用户点击套餐后：

```text
调用 POST /billing/recharge-orders
生成 PENDING 订单
显示订单状态：未支付
```

因为 V1 不接真实支付，可以显示：

```text
支付接口暂未开放，当前为 Mock 支付模式。
```

开发环境可以显示：

```text
[模拟支付成功]
```

## 6. 充值记录

字段：

```text
订单号
创建时间
金额 RMB
Agent Tokens
状态
```

状态：

```text
未支付
已支付
```

过期未支付订单不展示。

## 7. 过期策略

订单 15 分钟未支付后自动过期。

用户端规则：

```text
未过期 PENDING：展示
过期 PENDING / EXPIRED：不展示
PAID：展示
```

## 8. 余额流水入口

V1 可以在页面下方增加：

```text
查看 Agent Tokens 流水
```

流水字段：

```text
时间
类型
增加 / 扣除
数量
余额变化
说明
```

## 9. 用户提示

页面应明确：

```text
Agent Tokens 是 Jarvis 平台余额。
充值订单支付成功后，Agent Tokens 会立即到账。
V1 暂未接入真实支付，当前仅支持测试支付流程。
```


---

# v1.5.10 Update：Manual Recharge Display

管理员手动增加 Agent Tokens 不显示在用户充值订单列表中。

它显示在余额流水中：

```text
管理员充值 +5000 Agent Tokens
```

用户端不展示操作管理员信息，只展示来源为“管理员充值 / 系统充值”。
