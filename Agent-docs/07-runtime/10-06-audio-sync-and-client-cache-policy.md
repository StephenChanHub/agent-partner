# 10-06. Audio Sync & Client Cache Policy

## 1. 设计结论

V1 阶段，Jarvis 的语音策略正式定义为：

```text
文字全端同步，语音本地缓存。
```

也就是说：

```text
Core 保存文字消息。
Core 不长期保存音频文件。
Web 可把音频保存到 IndexedDB。
Device 播放音频后立即删除。
```

这套策略的目标是：

```text
降低服务端存储压力
降低隐私和权限复杂度
保持多端文字历史一致
保留当前浏览器长期播放历史语音的体验
```

---

## 2. Core 保存什么？

Core 只保存 Agent Session 的真实会话历史。

例如用户通过树莓派说：

```text
树莓派，今天天气怎么样？
```

Core 保存：

```text
User: 树莓派，今天天气怎么样？
Assistant: 今天天气晴。
```

Core 不长期保存：

```text
用户原始录音
ElevenLabs 生成的 TTS 音频
历史 audioUrl
音频二进制文件
```

---

## 3. Core 临时音频是什么？

Core 仍然需要短时间保存一个临时音频文件，作为在线客户端下载和播放的中转资源。

例如：

```text
/tmp/jarvis/audio/msg_assistant_123.mp3
```

临时音频默认有效期：

```text
10 分钟
```

可通过环境变量配置：

```env
TEMP_AUDIO_TTL_SECONDS=600
```

临时音频过期后必须删除。

---

## 4. 为什么需要临时音频？

因为一次语音回合中可能同时存在多个在线客户端：

```text
树莓派正在播放
网页端正在同步
未来手机端可能也在线
```

Core 生成一次 TTS 音频后，短时间给在线客户端下载即可。

这不是长期存储，只是一个短期分发窗口。

---

## 5. Web 客户端策略

Web 客户端如果在线，会收到：

```text
message.created
+
temp audio url
```

然后执行：

```text
下载临时音频
↓
播放
↓
按 messageId 存入 IndexedDB
```

IndexedDB 记录建议：

```json
{
  "messageId": "msg_assistant_123",
  "audioBlob": "Blob(audio/mpeg)",
  "mimeType": "audio/mpeg",
  "voiceProfileId": "voice_profile_jarvis_male",
  "createdAt": "2026-06-28T10:00:00.000Z",
  "sizeBytes": 128000
}
```

只要用户不清除浏览器站点数据、不卸载浏览器、不更换浏览器，这条语音就可以长期在当前浏览器播放。

---

## 6. Device / Raspberry Pi 策略

树莓派和其他黑盒硬件客户端采用：

```text
Call-like Turn-based Voice Mode
```

体验上像打电话，技术上仍然是回合制。

流程：

```text
录音
↓
上传 Core
↓
上传后删除本地录音
↓
等待 Core 返回语音
↓
播放语音
↓
播放后删除本地音频
```

树莓派不保存：

```text
历史录音
历史回复音频
聊天记录
Agent 配置
本地数据库
```

---

## 7. 多端同步规则

多端同步的是文字消息，而不是音频文件。

| 数据 | Core | Web A | Web B | Device |
|---|---:|---:|---:|---:|
| 用户文字消息 | 保存 | 同步 | 同步 | 不长期保存 |
| 助手文字回复 | 保存 | 同步 | 同步 | 不长期保存 |
| 临时音频 | 短期保存 | 可下载 | 可下载 | 可下载 |
| 本地历史音频 | 不保存 | IndexedDB | IndexedDB | 不保存 |

---

## 8. 一小时后另一台电脑为什么没有语音？

因为：

```text
Core 临时音频已经过期。
电脑 B 没有电脑 A 的 IndexedDB。
所以电脑 B 只能看到文字。
```

这是符合设计的。

UI 应显示：

```text
语音不在当前设备。
[重新生成语音]
```

---

## 9. 重新生成语音

如果某条 assistant 消息没有本地音频，Web 可以基于已保存文字重新生成语音。

流程：

```text
用户点击“重新生成语音”
↓
发送 messageId
↓
Core 读取 assistant 文本
↓
Core 读取 Agent 当前 voiceProfile
↓
调用 TTS Adapter
↓
返回新的临时音频
↓
Web 保存到 IndexedDB
```

注意：重新生成会产生新的 TTS usage。

---

## 10. Message Metadata 建议

messages 表不保存 audioUrl，但可以保存音频生成元信息：

```json
{
  "audio": {
    "generated": true,
    "storage": "client_indexeddb",
    "provider": "elevenlabs",
    "voiceProfileId": "voice_profile_jarvis_male",
    "cacheKey": "msg_assistant_123",
    "ttsCharacters": 8
  }
}
```

这只是说明该消息曾经生成过语音，不代表服务端仍然保存音频。

---

## 11. V1 不做

```text
服务端长期音频存储
跨设备音频同步
历史音频 CDN
对象存储生命周期管理
音频资产权限系统
音频转码服务
音频审核系统
```

这些都属于 V2 或商业化后期能力。
