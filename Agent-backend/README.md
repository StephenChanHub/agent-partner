# Jarvis Core Backend Skeleton

版本：v1.6.2 Admin Studio API Readiness

本目录是 Jarvis Core 的本地沙盒后端骨架。v1.6.2 的目标是让 Jarvis Studio 管理员网页端可以开始对接稳定 Mock API。

## 1. 环境要求

```text
Node.js 22 LTS
npm 10+
```

## 2. 启动

```bash
cp .env.sandbox.example .env
npm install
npm run start:sandbox
```

默认服务：

```text
http://localhost:3000/api
```

管理员端本地默认：

```text
http://localhost:5173
```

## 3. 管理员沙盒账号

```text
Email: admin@jarvis.local
Password: admin123456
```

## 4. Smoke Test

另开终端：

```bash
bash scripts/sandbox-smoke-test.sh
```

## 5. v1.6.2 已正式包含的本地修复

```text
tsconfig.json
tsconfig.build.json
nest-cli.json
src/main.ts
PrismaService Sandbox Stub
RuntimeContext 类型收口
Chat / Voice / Robot / System Engine run() Stub
Admin Studio API Mock Contract
```

## 6. 关键 API

```text
GET  /api/health
GET  /api/ready
POST /api/auth/login
GET  /api/me
GET  /api/studio/dashboard
GET  /api/studio/users
POST /api/studio/users/:id/tokens/adjust
GET  /api/studio/agents
GET  /api/studio/model-profiles
GET  /api/studio/voice-profiles
GET  /api/studio/recharge-orders
GET  /api/studio/token-transactions
GET  /api/studio/usage-records
POST /api/chat
POST /api/voice
```

## 7. 沙盒边界

本阶段不连接真实：

```text
DeepSeek
ElevenLabs
微信支付
支付宝支付
MySQL
Redis
```

但 API 形状必须稳定，供 Jarvis Studio 前端开始开发。


## v1.7 Mac 本地主机 + UTM Ubuntu 沙盒说明

本项目目录在新根结构中命名为 `Agent-backend`。

推荐运行方式：

```bash
cd Agent-backend
cp .env.sandbox.example .env
npm install
npm run start:sandbox
```

如果 Core 跑在 UTM Ubuntu，管理员网页端跑在 Mac 本机，后端必须监听所有网卡：

```env
HOST=0.0.0.0
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Mac 浏览器访问后端 API 时使用：

```text
http://192.168.64.2:3000/api
```

其中 `192.168.64.2` 是当前规划的 UTM Ubuntu IP。如果 VM IP 改变，只需要修改 `Agent-Studio Web/.env.local` 中的 `VITE_API_BASE_URL`。

## v1.7.2 Voice preview APIs

Voice Profile responses now include `previewAudioUrl`. The legacy `previewUrl` alias is still tolerated in DTOs during migration.

Reserved endpoint:

```http
POST /api/studio/voice-profiles/:id/preview-audio
```

This endpoint is not used by Studio Web in v1.7.2. Local preview audio remains browser-only.
