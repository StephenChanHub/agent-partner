# V1 Mock API Runbook

## 1. 启动 Mock 模式

```bash
cd 13-backend-skeleton
cp .env.example .env
npm install
npm run start:mock
```

Mock 模式环境变量：

```env
LLM_PROVIDER=mock
TTS_PROVIDER=mock
STT_PROVIDER=mock
CACHE_DRIVER=memory
RECHARGE_PAYMENT_PROVIDER=mock
```

## 2. 本地联调顺序

### Step 1：发送邮箱验证码

```bash
curl -X POST http://localhost:3000/auth/email-code/send \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}'
```

### Step 2：注册用户

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123","code":"123456"}'
```

### Step 3：文字聊天

```bash
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"agentSlug":"jarvis","message":"你好 Jarvis","client":"web"}'
```

### Step 4：语音聊天 Mock

```bash
curl -X POST http://localhost:3000/voice \
  -H 'Content-Type: application/json' \
  -d '{"agentSlug":"jarvis","mockText":"今天天气怎么样？","client":"web"}'
```

### Step 5：创建充值订单

```bash
curl -X POST http://localhost:3000/billing/recharge-orders \
  -H 'Content-Type: application/json' \
  -d '{"packageId":"pkg_5"}'
```

## 3. 切换 DeepSeek

填入：

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_MODEL=deepseek-chat
```

重启后端。

## 4. 切换 ElevenLabs

填入：

```env
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=xxx
ELEVENLABS_DEFAULT_MODEL_ID=eleven_v3
ELEVENLABS_DEFAULT_OUTPUT_FORMAT=mp3_44100_128
```

重启后端。

## 5. 注意事项

```text
1. v1.6 不接真实支付。
2. v1.6 不长期保存服务端音频。
3. v1.6 语音历史由 Web IndexedDB 负责。
4. v1.6 设备端播放后删除音频。
5. DeepSeek / ElevenLabs 真实调用必须通过 Adapter，不允许写进业务模块。
```
