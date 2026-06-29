# v1.7.3 Studio Safety, Avatar Policy & Pricing Rules CRUD

## 目标

v1.7.3 解决三个 Studio 可用性问题：

1. 统一所有头像类 UI：固定 `#0D21A5` 蓝色底 + 白色首字符。
2. Agent / Model / Voice 删除操作补齐，并强制“警告 → 再次确认”。
3. Pricing 页面不仅支持充值套餐 CRUD，也支持核心计费规则 CRUD。

## 头像策略

V1.7.3 统一规则：

- 所有头像类 UI 使用 `#0D21A5` 蓝色背景。
- 头像文字为白色首字符。
- Agent 编辑页头像字符加大，作为 Studio Profile 的视觉主标识。
- `avatarUrl` 字段与接口继续保留，但 Studio 不开放头像 URL 输入或上传入口。
- 前端不渲染头像图片，即使 Mock 数据里存在 `avatarUrl`。

### 为什么不开放头像图片

V1 当前仍处于沙盒阶段，不做文件上传、对象存储和媒体 CDN。头像上传会引入额外链路：文件校验、存储、访问权限、缓存、删除、替换和审计。为了避免拖慢主线，V1.7.3 只保留字段，不开放入口。

## 删除操作安全交互

以下资源新增删除操作：

- Agent
- Model Profile
- Voice Profile
- Pricing Rule
- Recharge Package

删除操作必须走两层确认：

1. 第一层：危险警告，说明删除影响。
2. 第二层：再次确认，明确这是永久删除而不是禁用。

V1 沙盒阶段删除会从 Mock 数据中移除。后续真实数据库阶段建议优先实现软删除或引用检查。

## Pricing Rules CRUD

Pricing 页面拆成两个 Tab：

- 计费规则 CRUD
- 充值套餐 CRUD

计费规则字段：

| 字段 | 说明 |
|---|---|
| key | 稳定配置键 |
| label | 后台展示名称 |
| group | CORE / BALANCE / VOICE / LLM / TTS / SYSTEM |
| valueType | NUMBER / STRING / BOOLEAN |
| value | 实际规则值 |
| unit | 单位 |
| description | 说明 |
| editable | 是否允许编辑 |
| status | ACTIVE / DISABLED |
| sortOrder | 排序 |

初始规则包括：

- Agent Tokens 兑换比例
- 计费倍率
- 文字聊天最低余额
- 语音聊天最低余额
- 语音回复最大字符数
- DeepSeek cache hit / cache miss / output 单价
- ElevenLabs TTS 单价

LLM Provider Mode 和 TTS Provider Mode 暂时作为运行模式展示，不做强制 CRUD。它们仍由 `.env` 控制：`LLM_PROVIDER`、`TTS_PROVIDER`。

## 前端实现

新增：

- `src/components/AvatarInitial.tsx`
- `src/utils/confirmDangerTwice.ts`

更新：

- `AgentsPage.tsx`
- `AgentEditPage.tsx`
- `ModelProfilesPage.tsx`
- `VoiceProfilesPage.tsx`
- `PricingPage.tsx`
- `StudioLayout.tsx`
- `global.css`
- `studio.ts`
- `api.ts`

## 不做范围

V1.7.3 不做：

- 头像图片上传
- 头像图片裁剪
- 媒体文件上传到 UTM
- 删除前引用关系真实数据库校验
- LLM/TTS provider mode CRUD
- 真实支付配置 CRUD
