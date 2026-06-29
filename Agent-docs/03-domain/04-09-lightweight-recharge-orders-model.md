# Lightweight Recharge Orders Model v1.5.9

## 1. 为什么 V1 也需要订单系统

V1 暂不接真实微信 / 支付宝支付，但只要系统存在充值和 Agent Tokens 余额，就必须有最小订单和余额流水。

否则用户和管理员无法回答以下问题：

```text
用户什么时候充值？
充值多少钱？
到账多少 Agent Tokens？
订单是否支付成功？
余额为什么增加或减少？
```

所以 V1 不做复杂支付系统，但必须做轻量账务闭环。

## 2. 三个核心对象

```text
RechargeOrder
AgentTokenTransaction
UsageRecord
```

它们分别代表：

```text
RechargeOrder = 充值订单
AgentTokenTransaction = 余额流水
UsageRecord = 消费明细
```

三者不要混在一起。

## 3. RechargeOrder

充值订单表示一次用户充值行为。

```text
用户选择套餐
↓
创建订单
↓
等待支付
↓
支付成功后增加余额
```

V1 订单状态：

```text
PENDING：未支付
PAID：已支付
EXPIRED：已过期
```

V1 不做取消订单，用户不支付即可自动过期。

## 4. AgentTokenTransaction

余额流水解释余额为什么变化。

常见流水：

```text
RECHARGE：充值到账
USAGE：对话扣费
ADMIN_ADJUST：管理员手动调整
REFUND：退款，V1 预留
GIFT：赠送，V1 预留
```

方向：

```text
CREDIT：增加余额
DEBIT：扣减余额
```

## 5. UsageRecord

UsageRecord 仍然负责记录每次模型 / 语音调用的真实用量。

例如：

```text
input_tokens
output_tokens
tts_characters
raw_cost_cny
cost_tokens
```

对话扣费时，会同时产生：

```text
usage_records 一条
agent_token_transactions 一条 DEBIT 流水
```

## 6. 充值成功时的账务闭环

```text
recharge_orders: PENDING → PAID
users.balance_tokens += order.agent_tokens
agent_token_transactions: CREDIT / RECHARGE
```

必须在数据库事务中完成。

## 7. 过期订单策略

V1 订单默认 15 分钟过期。

```text
PENDING 且 expires_at > now：用户端展示
PENDING 且 expires_at <= now：标记为 EXPIRED，不在用户端展示
PAID：永久展示
EXPIRED：用户端不展示，管理员端可查
```

V1 不需要定时任务，查询充值记录时可以顺手处理过期订单。

## 8. V1 支付策略

V1 只实现：

```text
MOCK payment
```

真实支付预留：

```text
WECHAT
ALIPAY
payment_trade_no
payment_payload
payment webhook
```

但 V1 不接真实支付。

## 9. 专业边界

禁止：

```text
只修改 users.balance_tokens，不写流水。
已支付订单再次支付重复加余额。
删除订单记录。
用 usage_records 代替余额流水。
```

必须：

```text
所有余额变化都写 agent_token_transactions。
订单号唯一。
只有 PENDING 订单可以支付成功。
支付成功必须事务化。
```
