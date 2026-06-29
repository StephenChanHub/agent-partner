# Agent-Studio Web

版本：v1.7.1 Studio UX & Pricing CRUD  
定位：Jarvis Platform 管理员网页端，先连接本地沙盒 Core，不接真实业务。

## 1. 技术栈

```text
React + Vite + TypeScript
Ant Design
React Router
TanStack Query
Axios
Zustand
```

UI 风格：模仿 iOS，主色为 iOS Blue，背景以白 / 灰 / 毛玻璃卡片为主。

## 2. 本地拓扑

```text
Mac 本地主机：Agent-Studio Web
UTM Ubuntu：Agent-backend / Jarvis Core
Ubuntu IP：192.168.64.2
Core API：http://192.168.64.2:3000/api
Studio Web：http://localhost:5173
```

## 3. 启动

在 Mac 上执行：

```bash
cd "Agent-Studio Web"
cp .env.local.example .env.local
npm install
npm run dev
```

默认管理员账号：

```text
admin@jarvis.local
admin123456
```

## 4. 环境变量

```env
VITE_API_BASE_URL=http://192.168.64.2:3000/api
VITE_APP_ENV=sandbox
VITE_DEFAULT_ADMIN_EMAIL=admin@jarvis.local
```

如果 UTM Ubuntu IP 变化，只需要修改 `VITE_API_BASE_URL`。

## 5. 已包含页面

```text
/login
/dashboard
/users
/users/:id
/agents
/agents/new
/agents/:id/edit
/model-profiles
/voice-profiles
/billing/recharge-orders
/billing/token-transactions
/billing/usage-records
/billing/pricing
```

## 6. v1.7.1 重点

### Agent 独立编辑页

Agent 列表页只负责进入编辑。详细编辑页参考 Instagram 个人主页布局：

```text
上方：头像、名称、状态、照片/视频数量、描述、基础表单
下方：照片 / 视频展示网格
```

本地添加照片和视频时：

```text
只通过 URL.createObjectURL 做浏览器本地预览
不上传到 UTM Ubuntu
不调用上传接口
不写入后端媒体存储
```

### Pricing 套餐 CRUD

Pricing 页面新增充值套餐管理：

```text
创建套餐
编辑套餐
删除套餐
启用 / 停用
快捷赠送：+10% / +20% / +50% Tokens
重置赠送
```

所有变更只作用于沙盒 Mock 数据。

## 7. 重要约束

- 管理员端先只对接 Mock API。
- 不接真实 DeepSeek。
- 不接真实 ElevenLabs。
- 不接真实微信 / 支付宝。
- 媒体预览不上传。
- 管理员手动充值通过 `/studio/users/:id/tokens/adjust`，不是直接修改余额。

## v1.7.2 Voice preview notes

Voice Profile editing now uses dedicated routes:

```text
/voice-profiles/new
/voice-profiles/:id/edit
```

Local audio selection in the Voice editor is browser-only preview. It creates an object URL and does not upload to the backend or persist after refresh.

Agent editor only selects published/active Voice Profiles and shows the selected voice sample using `previewAudioUrl`.
