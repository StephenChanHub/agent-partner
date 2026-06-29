# 11-20. Audio Temp Storage Module

## 1. 模块职责

Audio Temp Storage Module 负责 Core 中的短期音频中转。

它不是音频资产管理系统。

职责只有：

```text
保存短期音频
生成临时访问 URL
TTL 到期删除
支持在线客户端下载
```

---

## 2. 不负责什么

不负责：

```text
长期音频存储
音频历史回放
跨设备音频同步
CDN 分发
音频转码
音频审核
媒体资产管理
```

---

## 3. 配置

`.env`：

```env
TEMP_AUDIO_DRIVER=local
TEMP_AUDIO_DIR=/tmp/jarvis/audio
TEMP_AUDIO_TTL_SECONDS=600
TEMP_AUDIO_MAX_SIZE_MB=20
```

V1 推荐：

```text
local filesystem + cleanup scheduler
```

---

## 4. Port 设计

```ts
export type TempAudioSaveInput = {
  messageId: string;
  buffer: Buffer;
  mimeType: string;
  extension: 'mp3' | 'wav' | 'webm';
  ttlSeconds?: number;
};

export type TempAudioSaveResult = {
  audioId: string;
  tempUrl: string;
  mimeType: string;
  expiresAt: Date;
  expiresIn: number;
};

export interface TempAudioStoragePort {
  save(input: TempAudioSaveInput): Promise<TempAudioSaveResult>;
  read(audioId: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
  delete(audioId: string): Promise<void>;
  cleanupExpired(): Promise<number>;
}
```

---

## 5. Runtime 使用方式

语音回复流程：

```text
LLM 生成 assistant text
↓
TTS Adapter 生成 audio buffer
↓
TempAudioStorage.save()
↓
返回 tempUrl
↓
Web / Device 下载播放
```

---

## 6. Audio Storage Policy

返回给客户端时必须声明策略。

Web：

```json
{
  "storagePolicy": "CLIENT_PERSISTENT_INDEXEDDB"
}
```

Device：

```json
{
  "storagePolicy": "PLAY_AND_DISCARD"
}
```

---

## 7. 清理机制

V1 可以用简单定时任务：

```text
每 5 分钟扫描一次 TEMP_AUDIO_DIR
删除 expiresAt < now 的文件
```

也可以使用文件名记录过期时间：

```text
aud_msg_123_20260628T101000Z.mp3
```

更推荐维护内存或 Redis metadata。

---

## 8. 安全要求

```text
临时 audioUrl 必须难以猜测
必须校验当前用户是否有权限访问该 message
不得暴露真实文件路径
不得把 temp audio 目录开放为静态目录无鉴权访问
日志不得记录完整本地路径和敏感 token
```

---

## 9. V1 后端骨架位置

```text
src/modules/runtime/audio/
├── temp-audio-storage.port.ts
├── local-temp-audio-storage.adapter.ts
├── temp-audio.service.ts
└── temp-audio.controller.ts
```
