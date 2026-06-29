# Jarvis Platform Docs v1.6.2

## 版本定位

当前版本：**v1.6.2 Admin Studio API Readiness**

这一版不是接入真实 DeepSeek、ElevenLabs、微信/支付宝，也不是开始真实线上业务，而是把 v1.6 的 Mock API 后端明确收敛成一个可本地验收的 **Sandbox Backend**。

核心原则：

```text
所有端先跑沙盒。
后端先本地 Mock 跑通。
管理员端先对接本地 Mock API。
网页用户端、树莓派端后续也先对接 Sandbox，不直接上服务器做真实业务。
```

## v1.6.2 的目标

```text
1. 固定本地沙盒运行方式
2. 固定 Mock Provider 策略
3. 固定 Admin Studio 开发前的 API 验收清单
4. 固定后端本地 Smoke Test 流程
5. 固定“不接真实数据、不接真实支付、不上生产”的工程边界
```

## 本地沙盒默认策略

```env
NODE_ENV=sandbox
LLM_PROVIDER=mock
TTS_PROVIDER=mock
STT_PROVIDER=mock
PAYMENT_PROVIDER=mock
EMAIL_PROVIDER=mock
CACHE_DRIVER=memory
DATABASE_MODE=mock
```

说明：

- DeepSeek API 只保留 Adapter 和环境变量，不调用真实接口。
- ElevenLabs API 只保留 Adapter 和环境变量，不调用真实接口。
- 支付接口只保留订单和 mock-pay，不接微信/支付宝。
- 邮箱验证码在沙盒中使用 mock email code，后续再接真实邮件服务。
- 数据库可以先使用内存 Mock，进入真实 Prisma 联调时再打开 MySQL。

## 管理员端能否开始

可以，但必须满足：

```text
1. Admin Login Mock 能返回 ADMIN JWT
2. /me 能返回 ADMIN 身份
3. Agent / Model / Voice / User / Billing 核心接口返回结构稳定
4. 管理员手动增加 Agent Tokens 可返回 transaction
5. Mock API 的错误结构稳定
6. CORS 允许 jarvis-studio 本地端口访问
```

## 推荐阅读顺序

1. `11-operations/22-local-sandbox-runbook.md`
2. `10-engineering/11-26-sandbox-backend-acceptance.md`
3. `05-api/07-16-admin-studio-api-contract-checklist.md`
4. `12-appendix/20-sandbox-api-smoke-test-checklist.md`
5. `13-backend-skeleton/README.md`

## 下一步

v1.6.2 通过后进入：

```text
v1.7 Jarvis Studio Web
```

也就是开始编写管理员网页端。

## 目录

```text
00-readme/       来源映射与文档说明
01-product/      产品介绍与流程
02-architecture/ 系统架构
03-domain/       领域模型
04-agent/        Agent Manifest
05-api/          API Contract 与 Mock API
06-database/     数据库与 Prisma
07-runtime/      Runtime Context / Audio / Stub
08-device/       设备绑定与语音模式
09-frontend/     Dashboard / Studio / Wallet UI
10-engineering/  后端模块、工程规范、Mock API、Sandbox 验收
11-operations/   安全、运维、Sandbox Runbook
12-appendix/     缺口分析、术语表、Smoke Test Checklist
13-backend-skeleton/ NestJS 后端骨架
```

## v1.6.2 Admin Studio API Readiness

本版正式补齐管理员网页端开工前的后端沙盒基线。

重点：

```text
1. 固化本地启动修复：tsconfig / nest-cli / src/main.ts
2. 沙盒 PrismaService Stub 正式入包
3. RuntimeContext / IntentResult / ActionResult 类型正式收口
4. Chat / Voice / Robot / System Engine run() Stub 正式入包
5. Admin Studio API 合同补齐
6. 统一 success/data/message/meta 响应格式
7. 用户、Agent、Model Profile、Voice Profile、Billing、Usage Mock API 可联调
8. sandbox-smoke-test.sh 更新为管理员端开工验收脚本
```

管理员沙盒账号：

```text
admin@jarvis.local
admin123456
```

后端启动：

```bash
cd 13-backend-skeleton
cp .env.sandbox.example .env
npm install
npm run start:sandbox
```

Smoke Test：

```bash
bash scripts/sandbox-smoke-test.sh
```

通过后即可进入：

```text
v1.7 Jarvis Studio Web
```
