# Device WebSocket Adapter v1.5

## 1. 目标

Device Gateway 负责 Core 与树莓派设备之间的实时连接。

它不是业务模块，而是基础设施适配器。

---

## 2. 连接关系

```text
Raspberry Pi Device
    ↓ WebSocket
DeviceGatewayAdapter
    ↓
Device Module / Runtime Module / Robot Module
```

---

## 3. Device Gateway Port

```typescript
export interface DeviceGatewayPort {
  sendToDevice(deviceId: string, event: DeviceOutboundEvent): Promise<void>;
  broadcastToUser(userId: string, event: DeviceOutboundEvent): Promise<void>;
  isDeviceOnline(deviceId: string): Promise<boolean>;
}
```

---

## 4. 入站事件

设备发往 Core：

```text
DEVICE_CONNECTED
DEVICE_HEARTBEAT
DEVICE_STATUS_CHANGED
VOICE_INPUT_UPLOADED
ROBOT_ACTION_ACK
ROBOT_ACTION_PROGRESS
ROBOT_ACTION_DONE
ROBOT_ACTION_FAILED
EMERGENCY_STOP_TRIGGERED
```

---

## 5. 出站事件

Core 发往设备：

```text
DISPLAY_STATE_CHANGED
PLAY_AUDIO
ROBOT_ACTION_COMMAND
SYSTEM_MESSAGE
REQUEST_STATUS_REPORT
FORCE_STOP
```

---

## 6. 心跳策略

```text
设备每 30s 上报 heartbeat
Core 在 Redis 中刷新 device online TTL
超过 90s 未刷新 → 标记离线
Dashboard 通过 WebSocket 收到 device.offline
```

---

## 7. 鉴权策略

设备连接必须携带：

```text
deviceId
deviceToken
```

Core 校验：

```text
1. deviceId 是否存在
2. deviceToken 是否有效
3. device 是否被禁用
4. device 是否属于某个 user
```

---

## 8. 与 Robot Transport 的关系

Device Gateway 是通信通道。

Robot Transport 是动作下发适配器。

在 V1.5 中，Robot Transport 可以复用 WebSocket Device Gateway，但边界不能混淆。

```text
Robot Engine
    ↓
RobotCommandPort
    ↓
WebSocketRobotTransportAdapter
    ↓
DeviceGatewayPort
    ↓
Raspberry Pi
```

---

## 9. 安全边界

Core 可以下发动作命令，但设备端必须保留最终安全裁决权。

例如：

```text
Core: move forward 100cm
Device: 前方障碍物，拒绝执行
Core: 记录 action failed
Dashboard: 显示失败原因
```
