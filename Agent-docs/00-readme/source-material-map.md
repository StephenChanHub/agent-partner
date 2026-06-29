# Source Material Map v1.5.5

本文档说明 v1.5.5 如何吸收近期讨论并更新项目文档。

## 1. 本次新增决策

### Agent Config Simplification

近期讨论确认：V1 阶段只做文字聊天和语音聊天，不实现真实工具调用。因此：

```text
Persona / Capability / Tool / Behavior / Prompt
```

在 V1 中统一收敛为：

```text
config.prompt
```

也就是一段由管理员编写的 Agent 配置提示词。

### Agent Social Gallery

Agent 被定义为类似“人”的数字角色，因此需要展示自己的社交资产：

```text
social.galleryImages[]
social.galleryVideos[]
```

这些字段用于 Agent 展示页的照片墙和视频墙。

## 2. 本次影响的核心文档

```text
README.md
03-domain/04-domain-model.md
03-domain/04-05-studio-resource-library-model.md
03-domain/04-06-skill-library-agent-profile-model.md
04-agent/05-agent-manifest.md
04-agent/05-01-agent-config-simplification.md
05-api/07-api-contract.md
05-api/07-02-agent-api.md
05-api/07-07-studio-api.md
05-api/07-10-studio-skill-library-api.md
06-database/08-database-architecture.md
06-database/08-04-skill-library-schema.md
06-database/08-07-agent-config-media-schema.md
06-database/schema.prisma
07-runtime/10-runtime-context-and-encapsulation.md
07-runtime/10-01-context-builder.md
07-runtime/10-04-skill-injection-strategy.md
07-runtime/10-05-behavior-policy-runtime.md
09-frontend/12-dashboard-and-studio.md
10-engineering/11-17-skill-library-modules.md
10-engineering/16-development-roadmap.md
12-appendix/17-gap-analysis-and-open-decisions.md
12-appendix/18-glossary.md
13-backend-skeleton/
```

## 3. V1 / V2 边界

| 能力 | V1 | V2 |
|---|---:|---:|
| 文字聊天 | ✅ | ✅ |
| 语音聊天 | ✅ | ✅ |
| Model Library | ✅ | ✅ |
| Voice Library | ✅ | ✅ |
| Agent Config Prompt | ✅ | ✅ |
| Agent 照片 / 视频展示 | ✅ | ✅ |
| Skill Library CRUD | ❌ | ✅ |
| 工具调用 | ❌ | ✅ |
| Robot Action 实际执行 | ❌ | ✅ |
| Persona / Capability / Behavior 拆分建模 | ❌ | ✅ |
| Embedding Memory | ❌ | ✅ |
---

# v1.5.6 Audio Sync & Client Cache Policy

本版本沉淀了最近关于语音文件同步和缓存的产品决策：

```text
Core 保存文字，不长期保存音频。
Core 只短时间提供 temp audio。
Web 客户端通过 IndexedDB 本地保存语音。
Device 客户端采用播放即删除策略。
多端同步的是文字消息，不是音频文件。
```

新增核心文档：

```text
07-runtime/10-06-audio-sync-and-client-cache-policy.md
09-frontend/12-01-web-audio-indexeddb-cache.md
08-device/09-01-device-call-like-voice-mode.md
06-database/08-08-audio-sync-client-cache-schema.md
10-engineering/11-20-audio-temp-storage-module.md
```


# v1.5.7 Email Registration & Single Admin Policy

本版本吸收最近关于用户注册与管理员账号的讨论，正式锁定：

```text
普通用户：邮箱验证码注册 + 邮箱密码登录
验证码：Redis TTL，不进 MySQL
管理员：后端唯一内置账号，密码哈希来自环境变量
```

更新文件：

```text
README.md
05-api/07-00-auth-registration-policy.md
05-api/07-01-auth-api.md
05-api/openapi.yaml
06-database/08-database-architecture.md
06-database/08-09-auth-email-verification-schema.md
06-database/schema.prisma
10-engineering/11-21-auth-email-registration-module.md
10-engineering/16-development-roadmap.md
11-operations/14-security-and-permissions.md
13-backend-skeleton/.env.example
13-backend-skeleton/src/modules/auth/*
```

---

# v1.5.8 Conservative Billing & Cost Control Update

本版本根据最新讨论补充：

```text
Agent Tokens 平台货币命名
1000 Agent Tokens = 1 RMB
真实成本 × 1.5 的初级收费标准
DeepSeek 初期模型费用换算
ElevenLabs 语音字符费用换算
文字 / 语音最低余额门槛
语音生成前二次余额检查
余额不足降级为文字回复
```

新增 / 更新文档：

```text
03-domain/04-08-conservative-billing-cost-control-model.md
05-api/07-12-conservative-billing-cost-control-api.md
06-database/08-10-agent-tokens-cost-control-schema.md
09-frontend/12-02-agent-tokens-recharge-and-usage-ui.md
10-engineering/11-22-conservative-billing-cost-control-module.md
```


## v1.5.9 Lightweight Recharge Orders

本版本根据充值订单与余额流水讨论新增：

```text
03-domain/04-09-lightweight-recharge-orders-model.md
05-api/07-13-lightweight-recharge-orders-api.md
06-database/08-11-lightweight-recharge-orders-schema.md
09-frontend/12-03-wallet-recharge-orders-ui.md
10-engineering/11-23-lightweight-recharge-orders-module.md
```

核心收敛：V1 不接真实支付，但必须具备轻量订单、充值记录、余额流水、Mock 支付、管理员查看订单与流水能力。


## v1.5.10 Admin Manual Token Adjustment

本版本来自项目讨论中对 V1 支付接口暂不真实接入后的运营补充：管理员端需要可以给用户手动增加 Agent Tokens，但必须保持轻量、专业、可审计。

沉淀为：

```text
03-domain/04-10-admin-manual-token-adjustment-model.md
05-api/07-14-admin-manual-token-adjustment-api.md
06-database/08-12-admin-manual-token-adjustment-schema.md
09-frontend/12-04-admin-user-token-adjustment-ui.md
10-engineering/11-24-admin-manual-token-adjustment-module.md
```


## v1.6 Mock API + Runtime Stub

v1.6 将前面 v1.2～v1.5.10 的设计正式收敛为可联调 API 骨架：

- `05-api/07-15-v1-core-mock-api.md`：核心 API Mock 实现范围。
- `07-runtime/10-07-runtime-stub-execution-flow.md`：Runtime Stub 执行链路。
- `10-engineering/11-25-mock-api-runtime-stub.md`：NestJS Mock API 模块落地说明。
- `11-operations/21-v1-mock-api-runbook.md`：本地启动、联调、切换真实 Provider 的操作手册。

DeepSeek API 和 ElevenLabs API 在 v1.6 中不强制真实调用，只通过 Adapter 预留环境变量和接口边界。


## v1.6.1 Update

新增 Sandbox Backend Acceptance：明确所有端先跑本地沙盒，管理员端在 Mock API 验收通过后再开发。新增本地 Runbook、Admin Studio API Checklist、Smoke Test Checklist、Local-first Development Policy。

## v1.6.2 Admin Studio API Readiness Update

本版基于 v1.6.1 和用户本地沙盒启动反馈，正式补齐管理员端开工前的后端 API 基线。

新增重点：

```text
05-api/07-17-admin-studio-api-readiness.md
10-engineering/11-28-admin-studio-backend-readiness.md
11-operations/23-admin-studio-smoke-test-runbook.md
12-appendix/21-local-fixes-officialized.md
13-backend-skeleton/tsconfig.json
13-backend-skeleton/tsconfig.build.json
13-backend-skeleton/nest-cli.json
```

正式纳入前几轮本地修复：

```text
src/main.ts
src/infrastructure/database/prisma.service.ts
src/modules/runtime/types/runtime-context.types.ts
src/modules/runtime/context/runtime-context.types.ts
src/modules/runtime/context/runtime-context.builder.ts
src/modules/runtime/chat-engine/chat-engine.service.ts
src/modules/runtime/robot-engine/robot-engine.service.ts
src/modules/runtime/dispatcher/task-dispatcher.service.ts
src/modules/runtime/intent-engine/intent-engine.service.ts
src/modules/runtime/system-engine/system-engine.service.ts
src/modules/runtime/voice-engine/voice-engine.service.ts
```


## v1.7.1 Studio UX & Pricing CRUD

补充管理员端 Agent Profile 编辑体验与 Pricing 套餐 CRUD。

新增文档：

```text
09-frontend/12-06-agent-profile-editor-and-pricing-crud.md
05-api/07-18-studio-ux-pricing-crud-api.md
10-engineering/11-30-studio-ux-pricing-crud-implementation.md
```

## v1.7.2 Voice Preview & Agent Voice Selection

Added professional Voice Profile preview audio ownership model:

- `VoiceProfile.previewAudioUrl` owns sample audio
- Agent stores only `voice.profileId`
- Agent edit page resolves selected Voice preview audio
- local preview audio upload is browser-only and not persisted


## v1.7.3 Studio Safety, Avatar Policy & Pricing Rules CRUD

本版根据用户新增要求补齐：

- 统一头像类视觉策略：`#0D21A5` 蓝底白色首字符。
- Agent 编辑页头像首字符加大。
- 头像图片字段 / 接口预留但不开放。
- Pricing 计费规则 CRUD。
- Agent / Voice / Model 删除操作。
- 删除操作必须警告并再次确认。

新增文档：

- `05-api/07-20-studio-safety-avatar-pricing-rules-api.md`
- `09-frontend/12-08-studio-safety-avatar-pricing-rules.md`
- `10-engineering/11-32-studio-safety-avatar-pricing-rules-implementation.md`

## v1.7.4 Update

- Added professional admin interactions and production-ready UX baseline.
- Added EnvironmentBanner, DataToolbar, ProductionReadinessPanel, ErrorBoundary and SystemReadinessPage.
- Added request trace headers and environment-safe configuration.
