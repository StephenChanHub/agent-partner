# 12-01. Web Audio IndexedDB Cache

## 1. 目标

Web 客户端在 V1 阶段负责保存本机历史语音。

核心规则：

```text
服务端保存文字。
浏览器保存语音。
```

---

## 2. 为什么不用 localStorage？

不使用 localStorage 存音频，因为：

```text
容量小
不适合二进制 Blob
同步读写会阻塞主线程
浏览器兼容体验差
```

V1 应使用：

```text
IndexedDB
```

---

## 3. IndexedDB 存储模型

数据库：

```text
jarvis_audio_cache
```

Object Store：

```text
audio_messages
```

Key：

```text
messageId
```

Value：

```ts
export type LocalAudioCacheRecord = {
  messageId: string;
  sessionId: string;
  agentId: string;
  audioBlob: Blob;
  mimeType: string;
  voiceProfileId?: string;
  source: 'runtime_voice' | 'websocket_sync' | 'regenerated';
  createdAt: string;
  sizeBytes: number;
};
```

---

## 4. 收到语音回复时

```text
收到 voice chat response 或 WebSocket audio.available
↓
fetch tempAudioUrl
↓
得到 audio Blob
↓
播放
↓
保存到 IndexedDB
```

保存时使用 assistant message id 作为 key。

```text
msg_assistant_123 -> audioBlob
```

---

## 5. 加载历史消息时

```text
从 Core 加载 messages
↓
对每条 assistant message 查询 IndexedDB
↓
如果有 audioBlob：显示播放按钮
↓
如果没有 audioBlob：显示“重新生成语音”
```

---

## 6. UI 状态

### 本地有语音

```text
Assistant: 今天天气晴。
▶ 播放语音
```

### 本地没有语音

```text
Assistant: 今天天气晴。
语音不在当前设备
[重新生成语音]
```

### 临时音频仍可下载

```text
Assistant: 今天天气晴。
正在同步语音...
```

---

## 7. 多设备表现

同一个账号在不同电脑登录：

```text
文字历史一致。
音频缓存不一致。
```

电脑 A 保存过语音，不代表电脑 B 也有这条语音。

---

## 8. 清理策略

V1 可以不主动清理 IndexedDB。

后续可以增加：

```text
手动清理语音缓存
按 Agent 清理
按 Session 清理
按大小上限清理
```

V1 只需要在设置页提示：

```text
语音记录仅保存在当前浏览器本地。清除浏览器站点数据、更换设备或使用隐身模式后，历史语音可能无法播放。文字记录不会丢失。
```

---

## 9. 重新生成语音

如果本地无语音，用户点击“重新生成语音”：

```text
POST /messages/{messageId}/regenerate-audio
```

Core 根据 assistant 文本和 Agent voiceProfile 重新生成语音。

重新生成成功后，Web 再保存到 IndexedDB。

---

## 10. V1 前端边界

V1 不做：

```text
音频跨浏览器同步
音频上传回服务端长期保存
音频 CDN 播放
复杂缓存容量管理
音频后台下载队列
```
