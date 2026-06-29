# Config and Environment Specification v1.5

## 1. 目标

Jarvis Core 必须从第一天开始统一配置管理。

所有环境变量必须集中定义、集中校验、集中读取，禁止在业务代码里直接调用：

```typescript
process.env.GEMINI_API_KEY
```

---

## 2. 配置分层

```text
.env.example      说明所有可用配置
.env.local        本地开发配置，不提交 Git
.env.production   生产配置，不提交 Git
ConfigModule      NestJS 统一加载
AppConfigService  应用内部读取配置
```

---

## 3. 环境变量分类

```text
App
├── NODE_ENV
├── PORT
├── API_PREFIX
└── CORS_ORIGIN

Database
├── DATABASE_URL
└── PRISMA_LOG_LEVEL

Auth
├── JWT_SECRET
├── JWT_EXPIRES_IN
└── DEVICE_TOKEN_SECRET

Cache
├── CACHE_DRIVER
├── REDIS_URL
└── REDIS_NAMESPACE

AI
├── LLM_PROVIDER
├── GEMINI_API_KEY
└── GEMINI_MODEL

Voice
├── TTS_PROVIDER
├── ELEVENLABS_API_KEY
├── ELEVENLABS_DEFAULT_VOICE_ID
├── STT_PROVIDER
└── STT_LANGUAGE

Device
├── DEVICE_GATEWAY_DRIVER
├── DEVICE_WS_PATH
└── DEVICE_HEARTBEAT_SECONDS

Robot
├── ROBOT_TRANSPORT_DRIVER
├── ROBOT_COMMAND_TIMEOUT_MS
├── ROBOT_MAX_MOVE_DISTANCE_CM
└── ROBOT_MAX_SPEED_LEVEL

Observability
├── LOG_LEVEL
├── REQUEST_LOGGING_ENABLED
└── TRACE_ID_HEADER
```

---

## 4. Provider 切换策略

本地开发默认使用 Mock：

```env
LLM_PROVIDER=mock
TTS_PROVIDER=mock
STT_PROVIDER=mock
CACHE_DRIVER=memory
ROBOT_TRANSPORT_DRIVER=mock
DEVICE_GATEWAY_DRIVER=mock
```

需要真实联调时再切换：

```env
LLM_PROVIDER=gemini
TTS_PROVIDER=elevenlabs
CACHE_DRIVER=redis
ROBOT_TRANSPORT_DRIVER=websocket
DEVICE_GATEWAY_DRIVER=websocket
```

---

## 5. 配置读取规则

业务模块不能读取底层环境变量。

允许：

```typescript
this.config.llm.provider
```

禁止：

```typescript
process.env.LLM_PROVIDER
```

---

## 6. 配置校验

启动时必须校验：

```text
- PORT 是否为合法数字
- DATABASE_URL 是否存在
- JWT_SECRET 在生产环境是否足够长
- 如果 LLM_PROVIDER=gemini，则 GEMINI_API_KEY 必须存在
- 如果 TTS_PROVIDER=elevenlabs，则 ELEVENLABS_API_KEY 必须存在
- Robot 最大移动距离必须为正数
- Device heartbeat 必须大于 0
```

---

## 7. .env.example

完整示例见：

```text
13-backend-skeleton/.env.example
```
