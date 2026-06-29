# 11-28 Admin Studio Backend Readiness

版本：v1.6.2

## 1. 背景

v1.6.1 已经完成沙盒后端验收标准，但用户本地启动时暴露了几个关键骨架缺口：

```text
tsconfig.json 缺失
nest-cli.json 缺失
TypeScript 6 编译规则变化
PrismaClient 在沙盒阶段不应强依赖
RuntimeContext 类型重复
Runtime Engine run 方法缺失
Nest 入口 dist/main 找不到
```

v1.6.2 将这些临时修复正式纳入项目包，避免后续重新解压后丢失。

## 2. 正式纳入的本地修复

### 2.1 TypeScript / Nest 配置

新增：

```text
13-backend-skeleton/tsconfig.json
13-backend-skeleton/tsconfig.build.json
13-backend-skeleton/nest-cli.json
```

关键策略：

```text
rootDir = ./src
outDir = ./dist
entryFile = main
incremental = false
```

### 2.2 src/main.ts

正式入口：

```text
src/main.ts
```

负责：

```text
启动 Nest App
设置全局前缀 /api
启用 CORS
启用沙盒友好的 ValidationPipe
```

### 2.3 Prisma Sandbox Stub

沙盒阶段不连接真实数据库。

```text
src/infrastructure/database/prisma.service.ts
```

提供：

```text
$connect
$disconnect
$queryRaw
```

这样 `/health` 和相关模块可以先跑通。

### 2.4 Runtime 类型收口

唯一真实类型文件：

```text
src/modules/runtime/types/runtime-context.types.ts
```

旧路径仅 re-export：

```text
src/modules/runtime/context/runtime-context.types.ts
```

统一补齐：

```text
RuntimeContext
IntentResult
ActionResult
RuntimeMessage
```

### 2.5 Runtime Engine Stub

正式补齐：

```text
chat-engine.run()
robot-engine.run()
voice-engine.run()
system-engine.run()
intent-engine.analyze()
task-dispatcher.dispatch()
```

## 3. 管理员端 API Readiness

本版补齐管理员端第一阶段所需 API：

```text
GET  /health
GET  /ready
POST /auth/login
GET  /me
GET  /studio/dashboard
GET  /studio/users
GET  /studio/users/:id
POST /studio/users/:id/tokens/adjust
GET  /studio/agents
POST /studio/agents
PATCH /studio/agents/:id
POST /studio/agents/:id/publish
POST /studio/agents/:id/disable
GET  /studio/model-profiles
POST /studio/model-profiles
PATCH /studio/model-profiles/:id
POST /studio/model-profiles/:id/test
GET  /studio/voice-profiles
POST /studio/voice-profiles
PATCH /studio/voice-profiles/:id
POST /studio/voice-profiles/:id/test
GET  /studio/recharge-orders
GET  /studio/token-transactions
GET  /studio/usage-records
```

## 4. 依赖版本收敛

`package.json` 不再使用全量 `latest`。

原因：

```text
latest 会导致不同机器安装出不同行为
TypeScript 6 可能触发配置错误
Prisma 新版本可能要求更高 Node
```

v1.6.2 明确建议：

```text
Node.js 22 LTS
TypeScript ~5.8.3
NestJS ^11
Prisma ^6.14
```

## 5. 本版完成后管理员端可以开工的条件

必须满足：

```text
npm install
npm run start:sandbox
Found 0 errors
GET /api/health 返回 success=true
POST /api/auth/login 返回 mock_access_token_admin
bash scripts/sandbox-smoke-test.sh 全部通过
```

满足后进入：

```text
v1.7 Jarvis Studio Web
```
