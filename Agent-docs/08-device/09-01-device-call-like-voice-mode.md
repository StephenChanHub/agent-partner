# 09-01. Device Call-like Turn-based Voice Mode

## 1. 定义

树莓派或其他黑盒硬件客户端在 V1 阶段采用：

```text
Call-like Turn-based Voice Mode
```

中文可以理解为：

```text
像打电话一样的回合制语音模式
```

用户体验像通话，但底层不是实时双工语音，而是一问一答。

---

## 2. 一次语音回合

```text
IDLE
↓
LISTENING
↓
UPLOADING
↓
THINKING
↓
SPEAKING
↓
IDLE
```

---

## 3. 设备端不保存文件

设备端必须遵守：

```text
录音上传后删除。
回复语音播放后删除。
不保存历史音频。
不保存本地聊天记录。
```

设备端只做：

```text
录音
上传
接收音频
播放
显示状态
上报状态
```

---

## 4. 和 Web 的同步关系

如果用户通过树莓派聊天：

```text
用户：树莓派，今天天气怎么样？
Jarvis：今天天气晴。
```

Core 会保存文字消息，并通过 WebSocket 同步到网页端。

网页端看到：

```text
User: 树莓派，今天天气怎么样？
Assistant: 今天天气晴。
```

如果网页端在线并在临时音频有效期内，会下载并保存语音到 IndexedDB。

树莓派本地仍然不保存这条语音。

---

## 5. 设备端音频处理

设备端收到 Core 返回：

```json
{
  "audio": {
    "tempUrl": "/api/v1/runtime/audio/temp/aud_01.mp3",
    "mimeType": "audio/mpeg",
    "storagePolicy": "PLAY_AND_DISCARD",
    "expiresIn": 600
  }
}
```

执行：

```text
下载到 /tmp/jarvis/current-reply.mp3
↓
播放
↓
删除 /tmp/jarvis/current-reply.mp3
```

也可以直接流式播放，不落盘。

---

## 6. V1 不做实时通话

V1 不做：

```text
WebRTC 实时语音
双工通话
边听边说
语音打断
连续麦克风流
实时降噪管线
```

这些都可以放到 V2。

---

## 7. 为什么这样设计

```text
硬件端存储空间有限
SD 卡频繁写入不稳定
黑盒设备缓存不易排查
音频历史本身不是跨设备资产
隐私风险更低
```

所以 V1 最稳策略是：

```text
设备端播放即丢弃。
Core 保存文字。
Web 负责本地音频缓存。
```
