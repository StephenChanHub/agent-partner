# 24 Mac Studio + Ubuntu Core 沙盒运行手册

版本：v1.7

## 1. Ubuntu 启动 Core

```bash
cd Agent-backend
cp .env.sandbox.example .env
npm install
npm run start:sandbox
```

确认 Core：

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready
```

## 2. Mac 启动 Studio

```bash
cd "Agent-Studio Web"
cp .env.local.example .env.local
npm install
npm run dev
```

浏览器打开：

```text
http://localhost:5173
```

## 3. 登录账号

```text
admin@jarvis.local
admin123456
```

## 4. 如果 Mac 连不上 Ubuntu

先确认 Ubuntu IP：

```bash
ip addr
```

如果不是 `192.168.64.2`，修改：

```text
Agent-Studio Web/.env.local
```

把：

```env
VITE_API_BASE_URL=http://192.168.64.2:3000/api
```

改成实际 IP。

## 5. 当前严禁

```text
直接上服务器
直接接真实支付
直接接真实大模型
直接处理真实用户业务
```

所有客户端：管理员端、网页用户端、树莓派端，都必须先连接沙盒。
