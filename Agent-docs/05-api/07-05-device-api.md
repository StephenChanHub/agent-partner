# 07-05. Device API

## 1. 模块职责

Device API 负责实体设备生命周期。

范围：

```text
设备配对
用户绑定
设备开机连接
设备心跳
设备 Telemetry
设备能力上报
设备管理
```

设备包括：

```text
树莓派语音终端
未来带轮子 / 腿部的移动设备
未来摄像头 / 机械臂设备
```

---

## 2. 设备认证方式

设备绑定后使用：

```http
Authorization: Device <device_token>
```

Device Token 不等同于用户 JWT。

原因：

```text
设备不应该保存用户密码
设备不应该每天登录
设备应该开机即用
```

---

## 3. POST /devices/pairing-code

设备请求配对码。

### 使用场景

树莓派首次启动，屏幕显示 QR Code。

### Request

```json
{
  "deviceSn": "RP-00001",
  "deviceName": "Jarvis Pi",
  "deviceType": "RASPBERRY_PI",
  "capabilities": {
    "audio": {
      "microphone": true,
      "speaker": true
    },
    "display": {
      "screen": true,
      "eyes": true
    },
    "mobility": {
      "enabled": false,
      "driver": null
    }
  }
}
```

### Response

```json
{
  "data": {
    "pairingCode": "JARVIS-8K2P",
    "qrPayload": "jarvis://pair?code=JARVIS-8K2P",
    "expiresAt": "2026-06-27T10:10:00.000Z"
  },
  "requestId": "req_01"
}
```

---

## 4. POST /devices/bind

用户绑定设备。

### Headers

```http
Authorization: Bearer <access_token>
```

### Request

```json
{
  "pairingCode": "JARVIS-8K2P",
  "displayName": "客厅 Jarvis"
}
```

### Response

```json
{
  "data": {
    "deviceId": "dev_01",
    "deviceSn": "RP-00001",
    "displayName": "客厅 Jarvis",
    "deviceToken": "device.secret.token",
    "status": "BOUND"
  },
  "requestId": "req_01"
}
```

注意：

```text
deviceToken 只在绑定成功时返回一次
设备应保存到本地安全文件
```

---

## 5. POST /devices/connect

设备开机连接。

### Headers

```http
Authorization: Device <device_token>
```

### Request

```json
{
  "deviceSn": "RP-00001",
  "clientVersion": "0.1.0",
  "capabilities": {
    "audio": {
      "microphone": true,
      "speaker": true
    },
    "display": {
      "screen": true,
      "eyes": true
    },
    "mobility": {
      "enabled": true,
      "type": "WHEELED",
      "commands": ["MOVE_FORWARD", "MOVE_BACKWARD", "TURN_LEFT", "TURN_RIGHT", "STOP"],
      "safety": {
        "obstacleSensor": true,
        "emergencyStop": true,
        "maxSpeedLevel": "LOW"
      }
    }
  }
}
```

### Response

```json
{
  "data": {
    "deviceId": "dev_01",
    "status": "ONLINE",
    "user": {
      "id": "usr_01",
      "nickname": "Stephen"
    },
    "currentSession": {
      "id": "ses_01",
      "agent": {
        "slug": "jarvis",
        "name": "Jarvis"
      }
    },
    "websocketUrl": "/api/v1/ws/device?token=device.secret.token",
    "serverTime": "2026-06-27T10:00:00.000Z"
  },
  "requestId": "req_01"
}
```

---

## 6. POST /devices/heartbeat

设备心跳。

### Headers

```http
Authorization: Device <device_token>
```

### Request

```json
{
  "deviceId": "dev_01",
  "status": "IDLE",
  "battery": {
    "level": 76,
    "charging": false
  },
  "network": {
    "wifiRssi": -52
  }
}
```

### Response

```json
{
  "data": {
    "ok": true,
    "serverTime": "2026-06-27T10:00:00.000Z"
  },
  "requestId": "req_01"
}
```

---

## 7. POST /devices/telemetry

设备上报更详细运行状态。

### Request

```json
{
  "deviceId": "dev_01",
  "telemetry": {
    "battery": {
      "level": 76,
      "voltage": 7.4,
      "charging": false
    },
    "mobility": {
      "state": "IDLE",
      "emergencyStop": false,
      "obstacleDetected": false,
      "lastCommandId": "cmd_01"
    },
    "temperature": {
      "cpu": 54.2
    }
  }
}
```

### Response

```json
{
  "data": {
    "ok": true
  },
  "requestId": "req_01"
}
```

---

## 8. GET /devices

用户查看自己的设备列表。

### Headers

```http
Authorization: Bearer <access_token>
```

### Response

```json
{
  "data": [
    {
      "id": "dev_01",
      "deviceSn": "RP-00001",
      "displayName": "客厅 Jarvis",
      "deviceType": "RASPBERRY_PI",
      "status": "ONLINE",
      "capabilities": {
        "audio": true,
        "display": true,
        "mobility": true
      },
      "lastSeenAt": "2026-06-27T10:00:00.000Z"
    }
  ],
  "requestId": "req_01"
}
```

---

## 9. GET /devices/{deviceId}

获取设备详情。

### Response

```json
{
  "data": {
    "id": "dev_01",
    "deviceSn": "RP-00001",
    "displayName": "客厅 Jarvis",
    "deviceType": "RASPBERRY_PI",
    "status": "ONLINE",
    "capabilities": {
      "audio": {
        "microphone": true,
        "speaker": true
      },
      "mobility": {
        "enabled": true,
        "type": "WHEELED",
        "commands": ["MOVE_FORWARD", "MOVE_BACKWARD", "TURN_LEFT", "TURN_RIGHT", "STOP"]
      }
    },
    "lastTelemetry": {
      "battery": {
        "level": 76,
        "charging": false
      },
      "mobility": {
        "state": "IDLE",
        "emergencyStop": false,
        "obstacleDetected": false
      }
    }
  },
  "requestId": "req_01"
}
```

---

## 10. PATCH /devices/{deviceId}

修改设备显示信息。

### Request

```json
{
  "displayName": "卧室 Jarvis"
}
```

---

## 11. DELETE /devices/{deviceId}

解绑设备。

### 行为

```text
1. 校验设备属于当前用户
2. 删除或吊销 deviceToken
3. 设备下次 connect 失败
4. 如果设备在线，推送 device.unbound
```

### Response

```json
{
  "data": {
    "success": true
  },
  "requestId": "req_01"
}
```

---

## 12. 错误码

| Code | HTTP | 场景 |
|---|---:|---|
| DEVICE_NOT_BOUND | 403 | 设备未绑定 |
| DEVICE_OFFLINE | 409 | 设备离线 |
| DEVICE_CAPABILITY_UNSUPPORTED | 400 | 能力不支持 |
| NOT_FOUND | 404 | 设备不存在 |
| FORBIDDEN | 403 | 访问他人设备 |
