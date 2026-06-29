# 16. Development Roadmap v1.5.8

## 1. 当前阶段定位

Jarvis 当前完成：

```text
v1.5.8 Conservative Billing & Cost Control
```

本阶段核心目标是让 V1 在进入 Mock API 前具备清晰成本边界：

```text
Agent Tokens 平台货币
DeepSeek 初期模型成本策略
ElevenLabs 语音成本策略
真实成本 × 1.5 定价
最低余额门槛
语音生成前二次余额检查
余额不足降级文字
```

## 2. 已完成阶段

```text
v1.0 Enterprise Docs
v1.1 Robot Mobility Ready Architecture
v1.2 API Contract
v1.3 Domain Lock + Prisma Schema
v1.4 Backend Module Skeleton
v1.5 Infrastructure Adapter
v1.5.1 Studio Resource Libraries
v1.5.2 Skill Library & Agent Profile（V2 设计保留）
v1.5.3 Runtime Context & Memory Strategy
v1.5.4 Usage & Billing Foundation
v1.5.5 Agent Config Simplification
v1.5.6 Audio Sync & Client Cache Policy
v1.5.7 Email Registration & Single Admin Policy
v1.5.8 Conservative Billing & Cost Control
```

## 3. v1.5.5 关键修正

```text
删除 V1 skill_profiles 表
移除 V1 SkillProfilesModule
Agent Manifest 改为 config.prompt
Agent Manifest 新增 social.galleryImages[] / social.galleryVideos[]
Studio Agent Editor 简化为 Basic / Social / Brain / Voice / Config / Test / Publish
Runtime Context 只注入 config.prompt / summary / recent messages
```

## 3.1 v1.5.6 关键修正

```text
正式锁定文字全端同步、语音本地缓存策略
Core 只短期保存 temp audio，默认 TTL 10 分钟
Web 使用 IndexedDB 按 messageId 保存 assistant 音频
Device 采用 Call-like Turn-based Voice Mode，播放后删除音频
多端同步的是文字 message，不是音频文件
新增 GET /runtime/audio/temp/:audioId 短期音频访问接口
新增 message.audio.available WebSocket 事件
```

## 3.2 v1.5.7 关键修正

```text
普通用户注册只支持邮箱验证码
验证码存 Redis，默认 TTL 5 分钟
注册接口必须携带 verificationCode
用户登录使用 email + password
管理员账号 V1 只有一个，来自后端环境变量
管理员密码使用 bcrypt hash，不写明文
V1 不做多管理员、不做 RBAC、不做 OAuth
```

## 3.3 v1.5.8 关键修正

```text
平台货币命名为 Agent Tokens
1000 Agent Tokens = 1 RMB
V1 初级收费标准 = 真实成本 × 1.5
初期大模型优先使用 DeepSeek API
ElevenLabs 是语音成本重点保护对象
文字模式最低余额 100 Agent Tokens
语音模式最低余额 1000 Agent Tokens
DeepSeek 先执行并按真实 usage 扣费
ElevenLabs 生成前二次检查余额
余额不足时只返回文字，不生成语音
语音模式默认限制回复长度，避免长 TTS
```

## 4. V1 最终范围

```text
邮箱验证码注册 / 登录
用户选择 Agent
文字聊天
语音聊天
设备绑定
硬件端语音聊天
管理员管理 Agent
管理员管理 Model Library
管理员管理 Voice Library
管理员管理用户
Agent Tokens 余额展示
轻量充值订单 / 充值记录 / 余额流水
管理员手动增加 Agent Tokens
基础 Usage 记录
Agent 展示图片 / 视频
```

## 5. V1 不做

```text
真实支付网关
复杂订单系统 / 真实支付订单接入
发票系统
复杂套餐系统
预扣 / 冻结 / 解冻
精确对话前费用承诺
Skill Library
工具调用
Robot Action 实际执行
复杂 Behavior Policy
复杂 Persona Builder
Embedding Memory
向量数据库
媒体资产管理系统
```

## 6. 下一阶段：v1.6 Mock API + Runtime Stub

目标：让 API 真正跑起来。

v1.6 应完成：

```text
Auth 最小实现：邮箱验证码注册、邮箱密码登录、唯一管理员登录
Agent List / Detail Mock
Agent Session 创建和切换
Text Chat Mock SSE
Voice Chat Mock STT + Mock LLM + Mock TTS
Agent Tokens 余额 Mock
Billing Pricing Mock
余额不足降级文字 Mock
Temp Audio URL Mock
Web IndexedDB audio cache integration
Device play-and-discard audio policy
Model Profile CRUD Mock
Voice Profile CRUD Mock
Usage Record Mock
Studio Agent Draft / Publish Mock
```

v1.6 不实现：

```text
真实工具调用
真实 Robot Action
真实支付系统
管理员扣减 Tokens 前端能力
复杂媒体上传
```

## 7. 后续阶段

```text
v1.7 Dashboard MVP
v1.8 Device Voice MVP
v1.9 Studio MVP
v2.0 Tool Skill / Robot Action / Advanced Agent Profile
```


---

# v1.5.9 Recharge Orders Note

V1 已新增轻量充值订单和余额流水能力。相关完整说明见：

```text
03-domain/04-09-lightweight-recharge-orders-model.md
05-api/07-13-lightweight-recharge-orders-api.md
06-database/08-11-lightweight-recharge-orders-schema.md
09-frontend/12-03-wallet-recharge-orders-ui.md
10-engineering/11-23-lightweight-recharge-orders-module.md
```

关键规则：订单记录充值行为，流水记录余额变化，Usage 记录消费明细。所有余额变化都必须写 `agent_token_transactions`。


---

# v1.5.10 Admin Manual Token Adjustment Note

V1 新增管理员手动增加 Agent Tokens。相关完整说明见：

```text
03-domain/04-10-admin-manual-token-adjustment-model.md
05-api/07-14-admin-manual-token-adjustment-api.md
06-database/08-12-admin-manual-token-adjustment-schema.md
09-frontend/12-04-admin-user-token-adjustment-ui.md
10-engineering/11-24-admin-manual-token-adjustment-module.md
```

关键规则：管理员手动充值不创建订单，只写余额流水；所有余额变化必须通过 Transaction Service，禁止直接修改 `users.balance_tokens`。


## v1.6 Mock API + Runtime Stub

v1.6 正式进入核心 API 可联调阶段。

范围：

```text
Auth Mock API
Agent Mock API
Agent Session Mock API
Text Chat Mock API
Voice Chat Mock API
Temp Audio API
Billing / Recharge / Transaction Mock API
Studio Agent / Model / Voice / User Mock API
DeepSeek Adapter Placeholder
ElevenLabs Adapter Placeholder
```

完成 v1.6 后，前端 Dashboard、Studio 和设备客户端可以开始并行联调。


# v1.6.1 Sandbox Backend Acceptance

在进入管理员端开发前，必须先跑通本地沙盒后端。所有客户端开发均遵循 Local-first：先接本地 Sandbox，再接测试环境，最后才进入真实服务。v1.6.1 通过后进入 v1.7 Jarvis Studio Web。

## v1.6.2 Admin Studio API Readiness

目标：在正式编写 Jarvis Studio 管理员网页端前，完成后端沙盒 API Readiness。

已完成：

```text
- TypeScript / Nest 项目配置正式入包
- 沙盒 Prisma Stub 正式入包
- Runtime Stub 类型和 Engine 方法修复正式入包
- Admin Login / Me / Dashboard API
- Studio Users API
- Admin Manual Token Adjustment API
- Studio Agents API
- Model Profiles API
- Voice Profiles API
- Recharge Orders API
- Token Transactions API
- Usage Records API
- Admin Studio Smoke Test
```

下一步：

```text
v1.7 Jarvis Studio Web
```


---

# v1.7.1 Studio UX & Pricing CRUD

v1.7.1 优化管理员端沙盒体验：

```text
Agent 编辑页独立为 /agents/new 与 /agents/:id/edit
Agent 编辑界面参考 Instagram 个人主页
照片 / 视频只做浏览器本地预览，不上传到 UTM Ubuntu
Pricing 页面套餐支持 CRUD
Pricing 套餐支持 +10% / +20% / +50% 赠送 Tokens 快捷操作
后端补齐 /studio/billing/packages Mock API
```

本阶段仍不接真实支付、不做真实媒体上传、不接真实业务。

## v1.7.2 Voice Preview & Agent Voice Selection

- Voice Profile uses `previewAudioUrl` as the formal sample-audio field.
- Voice management has dedicated create/edit pages.
- Voice list supports inline audio preview.
- Voice editor supports local audio file preview via browser object URL only.
- Agent editor selects published/active Voice Profiles and shows selected Voice preview audio.
- Reserved backend endpoint exists for future preview audio upload but is not used in sandbox.

## v1.7.4 Studio Professional Interaction & Production-Ready UX

- Upgrade Jarvis Studio from sandbox-only pages to a professional admin console baseline.
- Add environment awareness, Core readiness banner, production readiness panel and system readiness page.
- Standardize list interactions with DataToolbar: search, status filter, refresh and row selection.
- Add top-level ErrorBoundary.
- Add X-Request-ID, X-Client-App and X-Client-Env headers to every request.
- Keep real DeepSeek, ElevenLabs, payment, upload, audit persistence and RBAC as reserved production integrations.
