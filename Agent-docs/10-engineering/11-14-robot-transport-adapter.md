# Robot Transport Adapter v1.5

## 1. 目标

Robot Transport Adapter 负责把 Core 的标准 Robot Action 转换为设备端可接收的命令。

它不负责理解用户意图，也不负责直接控制硬件。

---

## 2. Robot Command Port

```typescript
export interface RobotCommandPort {
  send(command: RobotCommand): Promise<RobotCommandResult>;
  stop(deviceId: string, reason?: string): Promise<RobotCommandResult>;
}
```

---

## 3. Robot Command

```typescript
export interface RobotCommand {
  actionId: string;
  deviceId: string;
  commandType: 'MOVE' | 'TURN' | 'STOP' | 'FOLLOW' | 'DOCK' | 'STATUS';
  payload: Record<string, unknown>;
  timeoutMs?: number;
  traceId?: string;
}
```

---

## 4. 命令示例

### 向前移动

```json
{
  "actionId": "act_123",
  "deviceId": "dev_rpi_001",
  "commandType": "MOVE",
  "payload": {
    "direction": "FORWARD",
    "distanceCm": 40,
    "speed": "LOW"
  },
  "timeoutMs": 5000
}
```

### 左转

```json
{
  "actionId": "act_124",
  "deviceId": "dev_rpi_001",
  "commandType": "TURN",
  "payload": {
    "direction": "LEFT",
    "angleDeg": 90,
    "speed": "LOW"
  }
}
```

### 急停

```json
{
  "actionId": "act_stop_001",
  "deviceId": "dev_rpi_001",
  "commandType": "STOP",
  "payload": {
    "mode": "EMERGENCY"
  }
}
```

---

## 5. Adapter 类型

```text
MockRobotTransportAdapter
WebSocketRobotTransportAdapter
HttpRobotTransportAdapter
MqttRobotTransportAdapter（V2）
SerialRobotTransportAdapter（Device 本地，不在 Core）
```

---

## 6. 命令生命周期

```text
Action Created
    ↓
RobotCommandPort.send
    ↓
Command Sent
    ↓
Device ACK
    ↓
Device Progress
    ↓
Device Done / Failed
    ↓
Action Record Updated
```

---

## 7. 超时策略

```text
MOVE / TURN：默认 5 秒
FOLLOW：长任务，需要 session id
DOCK：默认 60 秒
STOP：最高优先级，1 秒内必须 ACK
```

超时后：

```text
1. action_records.status = FAILED
2. failureReason = TIMEOUT
3. 尝试发送 STOP
4. 通知 Dashboard
```

---

## 8. 安全限制

Core 层需要做第一层限制：

```text
最大移动距离
最大速度等级
是否允许机器人动作
用户权限
设备是否在线
```

Device 层需要做第二层限制：

```text
障碍物检测
电机驱动状态
电池电压
姿态稳定性
急停按钮
传感器健康
```

---

## 9. V1.5 决策

V1.5 只定义：

```text
RobotCommandPort
MockRobotTransportAdapter
WebSocketRobotTransportAdapter 骨架
动作命令数据结构
超时/失败/急停规则
```

不实现真实运动控制。
