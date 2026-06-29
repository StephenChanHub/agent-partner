# Local-first Development Policy v1.6.1

## 1. 核心原则

Jarvis V1 所有客户端都必须先对接本地 Sandbox。

```text
Admin Studio → Sandbox API → Mock Data
User Web → Sandbox API → Mock Data
Device Client → Sandbox API → Mock Data
```

不允许跳过 Sandbox 直接接生产服务器。

## 2. 开发顺序

```text
1. Jarvis Core Sandbox 跑通
2. Jarvis Studio 管理员端接 Sandbox
3. User Web 接 Sandbox
4. Device Client 接 Sandbox
5. 再接真实 Provider
6. 再上测试服务器
7. 再上生产服务器
```

## 3. 为什么要 Local-first

```text
控制成本
避免污染真实数据
接口更快稳定
前端可以独立开发
设备端不依赖公网
避免早期架构反复重构
```

## 4. Provider 接入顺序

V1 先保持：

```text
LLM_PROVIDER=mock
TTS_PROVIDER=mock
STT_PROVIDER=mock
PAYMENT_PROVIDER=mock
EMAIL_PROVIDER=mock
```

等 Admin Studio 和 User Web 都能跑通后，再逐个切换：

```text
DeepSeek
ElevenLabs
Email Provider
Payment Provider
```

## 5. 禁止事项

```text
禁止前端直接调用 DeepSeek
禁止前端直接调用 ElevenLabs
禁止设备端直接调用模型
禁止本地开发直接连生产数据库
禁止没有 OpenAPI 契约就新增前端字段
```

## 6. 结论

Local-first 是 Jarvis V1 的工程安全线。
