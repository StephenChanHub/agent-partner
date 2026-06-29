# 08-08. Audio Sync & Client Cache Schema

## 1. 数据库原则

V1 不新增音频文件表。

原因：

```text
Core 不长期保存音频。
音频不是服务端资产。
音频只作为临时中转文件或客户端本地缓存存在。
```

因此不创建：

```text
audio_files
audio_assets
message_audio
agent_audio_cache
```

---

## 2. messages 表

messages 表继续保存文字消息。

```text
role
content
metadata
created_at
```

语音聊天时：

```text
用户语音 → STT 文本 → messages.content
助手语音 → LLM 文本 → messages.content
```

---

## 3. metadata.audio

如果一条 assistant message 曾经生成过语音，可以在 metadata 中记录轻量元信息。

示例：

```json
{
  "audio": {
    "generated": true,
    "storage": "client_indexeddb",
    "cacheKey": "msg_assistant_123",
    "provider": "elevenlabs",
    "voiceProfileId": "voice_profile_jarvis_male",
    "ttsCharacters": 8,
    "lastGeneratedAt": "2026-06-28T10:00:00.000Z"
  }
}
```

注意：

```text
这里不保存 audioUrl。
这里不代表 Core 仍然保存音频文件。
这里只说明这条消息曾经被生成过语音。
```

---

## 4. runtime temp audio 不进入数据库

Core 临时音频可以存在：

```text
/tmp/jarvis/audio
Redis metadata
memory cache
```

但不进入 MySQL。

临时音频只需要：

```text
audioId
messageId
mimeType
expiresAt
filePath 或 buffer reference
```

这些属于运行期缓存，不是业务数据库。

---

## 5. usage_records 记录费用

虽然不保存音频文件，但 TTS 调用必须记录 usage。

例如：

```text
type = TTS_USAGE
user_id
agent_id
agent_session_id
message_id
voice_profile_id
tts_characters
cost_tokens
```

这样未来可以按：

```text
LLM tokens + STT seconds + TTS characters
```

计算费用。

---

## 6. V1 Prisma 影响

V1 不新增表。

只需要确认：

```text
messages.metadata Json? 已存在
usage_records 已存在
voice_profiles 已存在
```

因此 v1.5.6 不需要 Prisma schema 结构性变更。
