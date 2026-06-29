# Local Sandbox Runbook v1.6.1

## 1. 运行目标

本 Runbook 用于在本地启动 Jarvis Core Sandbox。

默认不接真实数据：

```text
LLM = mock
TTS = mock
STT = mock
Payment = mock
Email = mock
Cache = memory
Database = mock / optional MySQL
```

## 2. 推荐本地端口

```text
Jarvis Core API: http://localhost:3000/api
Jarvis Studio:   http://localhost:5174
User Web:        http://localhost:5173
```

## 3. 环境变量

复制沙盒环境：

```bash
cd 13-backend-skeleton
cp .env.sandbox.example .env
```

关键变量：

```env
NODE_ENV=sandbox
PORT=3000
API_PREFIX=api
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

LLM_PROVIDER=mock
DEEPSEEK_API_KEY=

TTS_PROVIDER=mock
ELEVENLABS_API_KEY=

STT_PROVIDER=mock
PAYMENT_PROVIDER=mock
EMAIL_PROVIDER=mock
CACHE_DRIVER=memory
DATABASE_MODE=mock
```

## 4. 启动方式

```bash
npm install
npm run start:sandbox
```

## 5. 健康检查

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/system/status
```

期望：

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "mode": "sandbox"
  }
}
```

## 6. 管理员登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jarvis.local","password":"admin123456"}'
```

返回：

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "role": "ADMIN"
    }
  }
}
```

## 7. Mock Provider 验证

### 7.1 文字聊天

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentSlug":"jarvis","message":"你好 Jarvis","client":"web"}'
```

### 7.2 语音聊天 Mock

```bash
curl -X POST http://localhost:3000/api/voice \
  -H "Content-Type: application/json" \
  -d '{"agentSlug":"jarvis","mockText":"今天天气怎么样","client":"web"}'
```

返回应包含：

```text
assistantMessage.content
audio.tempUrl
audio.storagePolicy
usage.costAgentTokens
```

## 8. 充值与余额 Mock 验证

### 创建充值订单

```bash
curl -X POST http://localhost:3000/api/billing/recharge-orders \
  -H "Content-Type: application/json" \
  -d '{"packageId":"pkg_5000"}'
```

### Mock 支付成功

```bash
curl -X POST http://localhost:3000/api/billing/recharge-orders/order_mock_1/mock-pay
```

### 管理员手动加 Agent Tokens

```bash
curl -X POST http://localhost:3000/api/studio/users/user_mock_1/tokens/adjust \
  -H "Content-Type: application/json" \
  -d '{"amountTokens":5000,"reason":"sandbox manual recharge"}'
```

## 9. Sandbox 不做的事情

```text
不接真实 DeepSeek
不接真实 ElevenLabs
不发送真实邮件
不接真实支付
不部署公网服务器
不保存长期音频文件
```

## 10. 通过标准

只有当 smoke test 全部通过，才进入管理员端开发。
