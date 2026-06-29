# Jarvis Backend Sandbox Acceptance v1.6.1

## 1. 目的

v1.6.1 的目标不是生产部署，而是确认 Jarvis Core 后端可以作为本地沙盒被管理员端、网页用户端、设备端依次接入。

一句话：

```text
先把沙盒跑通，再写管理员端；
后续网页用户端、树莓派端也都先接沙盒，不直接接真实服务器。
```

## 2. Sandbox 的定义

Sandbox 是一个本地开发环境：

```text
NestJS API
Mock LLM
Mock TTS
Mock STT
Mock Payment
Mock Email
可选 MySQL
可选 Redis
```

默认不调用：

```text
DeepSeek
ElevenLabs
微信支付
支付宝
真实邮件服务
真实短信服务
真实生产数据库
```

## 3. 为什么必须先跑 Sandbox

如果直接写管理员端并接真实服务，会有几个风险：

```text
1. API response 不稳定，前端反复改
2. 真实模型成本不可控
3. ElevenLabs 语音成本不可控
4. 支付流程未完成，充值页面无法闭环
5. 设备端调试会污染真实会话
6. 错误排查困难
```

Sandbox 可以先验证：

```text
接口结构
权限结构
页面流程
Mock 数据流
余额和订单逻辑
Runtime Stub 链路
```

## 4. v1.6.1 通过标准

后端必须满足以下条件，才能进入管理员端开发。

### 4.1 基础运行

```text
npm install 成功
npm run start:sandbox 成功
GET /api/health 返回 OK
GET /api/system/status 返回 sandbox 状态
```

### 4.2 认证

```text
POST /api/auth/login 使用 ADMIN_EMAIL / ADMIN_PASSWORD 成功
返回 accessToken
GET /api/me 返回 role=ADMIN
```

### 4.3 Studio 基础接口

```text
GET /api/studio/agents
GET /api/studio/model-profiles
GET /api/studio/voice-profiles
GET /api/studio/users
```

这些接口必须返回稳定结构，即使数据是 Mock。

### 4.4 Agent 管理

管理员端第一阶段至少需要：

```text
Agent 列表
Agent 详情
Agent 创建
Agent 更新
Agent 发布 / 禁用
Agent 测试文字回复
Agent 测试语音回复
```

如果某些接口暂未真实落地，必须返回 Mock 结构，不允许 404。

### 4.5 Model / Voice Library

```text
Model Profile CRUD 返回稳定结构
Voice Profile CRUD 返回稳定结构
测试连接 / 试听可以返回 Mock 成功
```

### 4.6 用户与账务

```text
用户列表返回 email / nickname / balanceTokens / usedTokens / lastSeenAt
管理员手动增加 Agent Tokens 可返回 transaction
充值订单列表可返回 paid / pending / expired mock 数据
余额流水可返回 credit / debit 明细
```

### 4.7 Runtime Stub

```text
POST /api/chat 返回文字回复
POST /api/voice 返回文字回复 + temp audio url
GET /api/runtime/audio/temp/{audioId} 返回 mock audio
```

## 5. Admin Studio 开发前 API 稳定要求

管理员端不要求后端真实入库，但要求 response shape 稳定。

例如用户列表必须固定：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "user_mock_1",
        "email": "user@example.com",
        "nickname": "Demo User",
        "role": "USER",
        "balanceTokens": 5000,
        "usedTokens": 120,
        "lastSeenAt": "2026-06-28T10:00:00.000Z",
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1
    }
  }
}
```

## 6. 不允许进入管理员端开发的情况

如果出现以下情况，先继续完善后端：

```text
Admin JWT 还没跑通
接口 response 没统一
Agent / Model / Voice / User / Billing 缺核心接口
Mock 数据结构不稳定
CORS 没配置
错误格式不统一
```

## 7. 结论

v1.6.1 的本质是：

```text
把后端从“有 API 文档”推进到“可被前端安全联调的本地沙盒”。
```

通过 v1.6.1 后，再开始：

```text
v1.7 Jarvis Studio Web
```
