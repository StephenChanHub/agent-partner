# 11-29 Jarvis Studio Web Local UTM Integration

版本：v1.7

## 1. 本地拓扑

```text
Mac 本地主机
└── Agent-Studio Web
    └── http://localhost:5173

UTM Ubuntu
└── Agent-backend / Jarvis Core
    └── http://192.168.64.2:3000/api
```

## 2. 后端要求

后端必须监听所有网卡：

```env
HOST=0.0.0.0
PORT=3000
```

CORS 必须允许 Mac 浏览器来源：

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## 3. 前端要求

`Agent-Studio Web/.env.local`：

```env
VITE_API_BASE_URL=http://192.168.64.2:3000/api
```

## 4. 检查顺序

```text
1. Ubuntu 后端 npm run start:sandbox
2. Ubuntu 本机 curl http://localhost:3000/api/health
3. Mac 浏览器打开 http://192.168.64.2:3000/api/health
4. Mac 启动 Agent-Studio Web
5. 管理员登录
6. Dashboard 加载成功
7. 用户列表加载成功
8. 手动充值成功
```
