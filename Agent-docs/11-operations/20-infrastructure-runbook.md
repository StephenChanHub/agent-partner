# Infrastructure Runbook v1.5

## 1. 本地启动顺序

```bash
cd 13-backend-skeleton
cp .env.example .env
npm install
npx prisma generate
docker compose up -d mysql redis
npm run start:dev
```

---

## 2. 最小开发模式

如果只想跑 Mock API，可以使用：

```env
LLM_PROVIDER=mock
TTS_PROVIDER=mock
STT_PROVIDER=mock
CACHE_DRIVER=memory
DEVICE_GATEWAY_DRIVER=mock
ROBOT_TRANSPORT_DRIVER=mock
```

这种模式不需要真实 Gemini、ElevenLabs、树莓派设备。

---

## 3. 数据库检查

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
```

---

## 4. Redis 检查

```bash
redis-cli ping
```

预期：

```text
PONG
```

---

## 5. 常见问题

### Prisma 无法连接

检查：

```text
DATABASE_URL
MySQL 容器是否启动
端口是否冲突
数据库名是否存在
```

### Redis 不可用

开发阶段可以切换：

```env
CACHE_DRIVER=memory
```

### Gemini Key 未配置

如果当前不是 AI 联调阶段，使用：

```env
LLM_PROVIDER=mock
```

### ElevenLabs Key 未配置

如果当前不是语音联调阶段，使用：

```env
TTS_PROVIDER=mock
```

### Robot Transport 不可用

如果当前没有树莓派设备，使用：

```env
ROBOT_TRANSPORT_DRIVER=mock
```

---

## 6. 生产环境最低要求

```text
DATABASE_URL 必须存在
JWT_SECRET 必须强随机
DEVICE_TOKEN_SECRET 必须强随机
LOG_LEVEL 不应为 debug
LLM_PROVIDER 不应为 mock
TTS_PROVIDER 可按阶段决定
CACHE_DRIVER 建议 redis
ROBOT_TRANSPORT_DRIVER 必须显式配置
```

---

## 7. 故障处理优先级

```text
1. 机器人急停 / 物理安全
2. 认证与权限
3. 数据库写入失败
4. Runtime Event 丢失
5. LLM / TTS 供应商失败
6. Dashboard 展示异常
```
---

# Temp Audio 运维策略

V1 Core 会生成短期音频中转文件，默认 TTL 为 10 分钟。

运维要求：

```text
配置 TEMP_AUDIO_DIR
配置 TEMP_AUDIO_TTL_SECONDS
定时清理过期文件
监控临时目录大小
禁止将临时目录作为公开静态目录暴露
```

建议开发环境：

```env
TEMP_AUDIO_DRIVER=local
TEMP_AUDIO_DIR=/tmp/jarvis/audio
TEMP_AUDIO_TTL_SECONDS=600
```
