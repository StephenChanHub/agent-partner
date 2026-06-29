# 23 Admin Studio Smoke Test Runbook

版本：v1.6.2

## 1. 目标

在编写 Jarvis Studio 管理员网页端之前，先确认本地沙盒后端 API 可以稳定返回。

## 2. 启动后端

```bash
cd 13-backend-skeleton
cp .env.sandbox.example .env
npm install
npm run start:sandbox
```

看到：

```text
Found 0 errors. Watching for file changes.
Jarvis Core sandbox API is running on http://localhost:3000/api
```

## 3. 执行 Smoke Test

另开终端：

```bash
cd 13-backend-skeleton
bash scripts/sandbox-smoke-test.sh
```

默认测试：

```text
GET  /api/health
POST /api/auth/login
GET  /api/me
GET  /api/studio/dashboard
GET  /api/studio/users
GET  /api/studio/agents
GET  /api/studio/model-profiles
GET  /api/studio/voice-profiles
GET  /api/billing/pricing
GET  /api/studio/recharge-orders
GET  /api/studio/token-transactions
POST /api/studio/users/user_mock_001/tokens/adjust
```

## 4. 管理员沙盒账号

```text
Email: admin@jarvis.local
Password: admin123456
```

返回 token：

```text
mock_access_token_admin
```

## 5. 常见问题

### 5.1 Could not find tsconfig.json

说明没有使用 v1.6.2 包，或文件被遗漏。

v1.6.2 必须包含：

```text
tsconfig.json
tsconfig.build.json
nest-cli.json
```

### 5.2 Cannot find dist/main

确认：

```text
src/main.ts 存在
nest-cli.json entryFile = main
tsconfig rootDir = ./src
```

### 5.3 PrismaClient 不存在

沙盒阶段不应依赖真实 PrismaClient。

确认：

```text
src/infrastructure/database/prisma.service.ts
```

是 Sandbox Stub。

### 5.4 RuntimeContext 类型错误

确认：

```text
src/modules/runtime/types/runtime-context.types.ts
src/modules/runtime/context/runtime-context.types.ts
```

已按 v1.6.2 版本统一。

## 6. 通过标准

只有满足以下条件，才进入管理员端页面开发：

```text
后端编译 0 errors
/api/health 可访问
管理员登录可用
用户列表可用
Agent 列表可用
Model Profile 列表可用
Voice Profile 列表可用
管理员手动加 tokens 可用
充值订单和流水可查看
```
