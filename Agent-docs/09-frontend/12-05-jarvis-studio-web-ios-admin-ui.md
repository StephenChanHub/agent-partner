# 12-05 Jarvis Studio Web iOS Admin UI

版本：v1.7  
状态：管理员网页端第一版已进入工程实现。

## 1. 定位

Jarvis Studio Web 是 Jarvis Platform 的管理员网页端。

第一版目标：

```text
连接本地沙盒 Core
验证管理员登录
验证用户管理
验证管理员手动增加 Agent Tokens
验证 Agent / Model / Voice / Billing / Usage 页面
为后续真实 Provider 接入做准备
```

## 2. UI 风格

整体模仿 iOS 管理体验：

```text
iOS Blue: #007AFF
White: #FFFFFF
System Gray Background: #F5F7FB
毛玻璃侧边栏
圆角卡片
轻阴影
清晰表格
弹窗 / 抽屉表单
```

## 3. 页面范围

```text
Admin Login
Dashboard
Users
User Detail
Agent Management
Model Profiles
Voice Profiles
Recharge Orders
Token Transactions
Usage Records
Pricing
```

## 4. 第一版不做

```text
真实支付
真实 DeepSeek
真实 ElevenLabs
多管理员 RBAC
复杂图表大屏
生产部署
```

## 5. 管理员手动充值

管理员页面提供“增加 Agent Tokens”入口。

调用：

```text
POST /api/studio/users/{id}/tokens/adjust
```

规则：

```text
reason 必填
amountAgentTokens > 0
后端写 agent_token_transactions
不得直接修改 users.balance_tokens
```
