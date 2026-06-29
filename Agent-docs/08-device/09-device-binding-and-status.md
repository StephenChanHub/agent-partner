# 09. 设备绑定与状态设计

## 1. 设计结论

树莓派不是“登录网页后的外设”，它本身就是用户的 Jarvis 终端。

因此，设备必须拥有独立身份，通过 Device Binding 与用户账号关联。

未来如果树莓派增加轮子、腿部、电机、摄像头或传感器，它仍然沿用同一套 Device Identity，只是上报更多 Capability 与 Telemetry。

---

## 2. 设备身份模型

```text
User
↓
Device
```

一个用户可以绑定多个设备：

```text
Stephen
├── Raspberry Pi Living Room
├── Jarvis Robot V2
├── Mac Desktop Client
└── iPhone Client（未来）
```

---

## 3. 设备类型

建议增加 `device_type`：

```text
VOICE_TERMINAL       # 只负责语音输入输出
DISPLAY_TERMINAL     # 带屏幕显示
MOBILE_ROBOT         # 带轮子或腿部移动能力
DESKTOP_CLIENT       # 桌面客户端
MOBILE_APP           # 手机客户端
```

V1 可以只使用：

```text
VOICE_TERMINAL
```

V2 再启用：

```text
MOBILE_ROBOT
```

---

## 4. 首次绑定流程

```text
设备第一次开机
↓
生成 device_sn
↓
请求 pairing_code
↓
屏幕显示 QR Code
↓
用户打开 Dashboard
↓
扫描绑定
↓
Core 创建 devices 记录
↓
Core 返回 device_token
↓
设备本地保存 token
```

本地文件示例：

```json
{
  "deviceId": "dev_xxx",
  "deviceSn": "RP-00001",
  "token": "device_token_plain_once"
}
```

注意：数据库只保存 token hash，不保存明文 token。

---

## 5. 日常开机流程

```text
设备开机
↓
读取本地 token
↓
POST /devices/connect
↓
Core 验证 token
↓
设备上线
↓
设备上报 capabilities
↓
Core 返回 current_session_id 和 current_agent
↓
设备显示 Ready
```

---

## 6. 设备能力上报

设备上线时必须上报 Capability。

V1 语音设备示例：

```json
{
  "audio": {
    "microphone": true,
    "speaker": true
  },
  "display": {
    "screen": true,
    "expression": true
  }
}
```

V2 移动机器人示例：

```json
{
  "audio": {
    "microphone": true,
    "speaker": true
  },
  "mobility": {
    "enabled": true,
    "type": "wheeled",
    "supportsMove": true,
    "supportsTurn": true,
    "supportsFollow": false,
    "supportsDock": false,
    "maxSpeedLevel": "LOW"
  },
  "sensors": {
    "battery": true,
    "imu": true,
    "distance": true,
    "camera": false
  },
  "safety": {
    "emergencyStop": true,
    "obstacleStop": true,
    "tiltProtection": true
  }
}
```

---

## 7. 设备状态

### 持久状态

保存在 MySQL：

```text
BOUND
REVOKED
DISABLED
```

### 实时状态

保存在 Redis / Event Bus：

```text
OFFLINE
ONLINE
IDLE
LISTENING
THINKING
SPEAKING
MOVING
TURNING
FOLLOWING
DOCKING
ERROR
EMERGENCY_STOPPED
```

实时状态不建议写入 MySQL，除非用于审计或故障记录。

---

## 8. 移动设备状态机

```text
ONLINE_IDLE
↓
COMMAND_RECEIVED
↓
LOCAL_SAFETY_CHECK
↓
EXECUTING
↓
DONE
↓
ONLINE_IDLE
```

异常分支：

```text
LOCAL_SAFETY_CHECK
├── OBSTACLE_DETECTED → BLOCKED
├── LOW_BATTERY       → BLOCKED
├── DEVICE_TILTED     → BLOCKED
└── E_STOP_ACTIVE     → BLOCKED
```

执行中异常：

```text
EXECUTING
├── COMMAND_TIMEOUT
├── MOTOR_ERROR
├── NETWORK_LOST
└── EMERGENCY_STOPPED
```

---

## 9. Heartbeat

设备定期上报：

```json
{
  "deviceId": "dev_xxx",
  "status": "ONLINE",
  "batteryPercent": 76,
  "motionState": "IDLE",
  "obstacleDetected": false,
  "timestamp": "2026-06-27T10:00:00Z"
}
```

建议频率：

| 场景 | 频率 |
|---|---:|
| 普通在线 | 30 秒 |
| 语音交互中 | 5 秒 |
| 移动执行中 | 0.5 ~ 1 秒 |
| 低电量或异常 | 立即上报 |

---

## 10. Command 通道

V1 可以使用 WebSocket 下发设备事件。

V2 如果机器人动作增多，可以考虑：

```text
WebSocket：简单双向通道，适合 V1 / Demo
MQTT：设备控制更标准，适合多设备与不稳定网络
Local UDP / ROS2：高级机器人控制，V3 再考虑
```

当前建议：

```text
V1 / V2 初期：WebSocket Command Channel
V2 稳定后：评估 MQTT
V3 高级机器人：评估 ROS2 Bridge
```

---

## 11. 设备本地安全原则

即使 Core 已经允许动作，设备本地也必须再次检查：

- 急停按钮是否触发
- 前方是否有障碍物
- 是否倾倒或过度倾斜
- 电量是否过低
- 电机是否过热
- 命令是否过期
- 命令是否来自绑定 Core

本地检查失败时，必须拒绝执行并上报结果。

---

## 12. Dashboard 展示

Dashboard 设备页需要显示：

```text
设备名称
设备类型
在线状态
当前 Agent
麦克风状态
播放状态
电量
是否充电
移动状态
急停状态
最近错误
Capability 摘要
```

对于移动设备，需要额外显示：

```text
移动能力是否开启
最大速度等级
障碍物检测状态
最近一次动作命令
急停按钮 / 禁用移动
```

---

## 13. 设备职责边界

Device 负责执行，不负责理解。

```text
Device 接收 Command
↓
本地安全检查
↓
硬件执行
↓
上报结果
```

Device 不应该：

- 自己调用 LLM 判断意图
- 自己绕过 Core 执行动作
- 保存用户聊天历史
- 保存 Prompt
- 修改 Agent 配置

---

## 14. 最终原则

> 树莓派从 V1 开始就是有身份的 Jarvis 终端；未来加上轮子或腿部后，它只是从 Voice Terminal 升级为 Robot Device，不改变 Core 为唯一大脑的原则。
---

# V1 Device Audio Storage Policy

硬件客户端是语音终端，不是音频资料库。

```text
录音上传后删除。
回复语音播放后删除。
设备端不保存历史音频。
设备端不保存本地聊天记录。
```

设备端会话同步基于 Core 保存的文字消息。网页端可接收同一会话的文字消息，并根据自身策略缓存语音。
