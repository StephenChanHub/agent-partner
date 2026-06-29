# V1 API Test Cases

## 1. Auth

- 发送邮箱验证码成功。
- 验证码过期后注册失败。
- 普通用户登录返回 USER token。
- 后端唯一管理员登录返回 ADMIN token。

## 2. Agent

- 用户可以获取已发布 Agent 列表。
- 用户可以查看 Agent 详情，包括 social.galleryImages 和 social.galleryVideos。
- 用户不能修改 Agent。

## 3. Chat

- 余额大于 100 Agent Tokens 时，文字聊天成功。
- 余额不足时，文字聊天被拒绝。
- 文字聊天返回 inputTokens、outputTokens、costAgentTokens。

## 4. Voice

- 余额大于 1000 Agent Tokens 时，语音聊天可生成语音。
- 文字生成后余额不足 TTS 时，只返回文字。
- Web 在线时可以下载 tempUrl 并存 IndexedDB。
- 另一台电脑登录只看到文字，不自动拥有语音。

## 5. Billing

- 创建订单后状态为 PENDING。
- 15 分钟未支付订单用户端不展示。
- mock-pay 后订单变 PAID，余额增加。
- 管理员手动增加 tokens 写入 agent_token_transactions。

## 6. Provider

- LLM_PROVIDER=mock 时不调用真实 DeepSeek。
- LLM_PROVIDER=deepseek 且无 key 时应报配置错误或回退 Mock，具体策略由环境决定。
- TTS_PROVIDER=mock 时不调用真实 ElevenLabs。
- TTS_PROVIDER=elevenlabs 且无 key 时应拒绝启动或回退 Mock。
