# 18. Glossary v1.5.5

## Agent

由管理员在 Studio 中创建和发布的 AI 数字角色。

V1 Agent = 基础信息 + 社交展示 + Model Profile + Voice Profile + Config Prompt。

## Agent Manifest

Agent 的版本化配置 JSON。

V1 包含：

```text
identity
social
model
voice
config
runtime
```

## Config Prompt

V1 中 Agent 最核心的配置提示词。

用于描述：

```text
人格
职业
能力
回答风格
行为边界
专属规则
```

## Social Gallery

Agent 的社交展示资产。

包含：

```text
galleryImages
galleryVideos
```

## Model Profile

大模型配置资源。

例如 Gemini、DeepSeek、OpenAI 等。

## Voice Profile

音色配置资源。

V1 主要用于 ElevenLabs voice_id、model_id、output_format 等配置。

## Skill Library

V2 能力。

V1 不实现 Skill Library，相关能力写入 Config Prompt。

## Agent Session

一个用户和一个 Agent 的长期会话空间。

## Usage Record

记录 LLM / STT / TTS 用量的明细。


## Email Verification Code

V1 用户注册验证码。只存 Redis，默认 5 分钟过期，验证成功后删除。

## Virtual Admin Principal

V1 管理员身份。管理员账号来自后端环境变量，不通过普通用户注册创建。

---

## Agent Tokens

Jarvis V1 的平台余额单位。

```text
1 RMB = 1000 Agent Tokens
```

用户充值、余额展示、每轮对话消耗都使用 Agent Tokens。

## Billing Multiplier

平台计费倍率。

V1 初级收费标准：

```text
最终扣费 = 真实成本 × 1.5
```

## Minimum Balance Gate

最低余额门槛。

```text
文字模式最低余额：100 Agent Tokens
语音模式最低余额：1000 Agent Tokens
```

## Voice Balance Second Check

语音二次余额检查。

DeepSeek 文字回复生成后，Core 在调用 ElevenLabs 前再次检查余额。余额不足时，不生成语音，只返回文字。


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
