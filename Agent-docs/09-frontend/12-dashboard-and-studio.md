# 12. Dashboard 与 Studio 设计 v1.5.5

## 1. 前端总原则

```text
Dashboard = 用户使用 Agent 的控制中心
Studio = 管理员生产 Agent 的工厂
```

## 2. Dashboard V1

用户可以：

```text
注册 / 登录
查看 Agent 列表
查看 Agent 详情页
查看 Agent 照片墙和视频墙
选择 Agent
文字聊天
语音聊天
查看聊天历史
绑定设备
查看余额和用量
```

用户不可以：

```text
创建 Agent
修改 Model
修改 Voice
修改 Config Prompt
修改照片 / 视频
```

## 3. Dashboard Agent 展示页

Agent 详情页展示：

```text
头像
名称
描述
照片墙 galleryImages
视频墙 galleryVideos
开始聊天按钮
```

页面结构：

```text
Agent Detail
├── Header: avatar / name / description
├── Gallery Images
├── Gallery Videos
├── Capability Badges: Chat / Voice
└── Start Chat
```

## 4. Dashboard 聊天

文字模式：

```text
用户输入文字
↓
POST /chat
↓
SSE 接收回复
↓
保存并渲染消息
```

语音模式：

```text
用户录音
↓
上传语音
↓
STT
↓
LLM
↓
TTS
↓
播放音频
```

## 5. Studio V1

Studio V1 页面：

```text
Studio
├── Agents
├── Model Library
├── Voice Library
├── Users
├── Usage
└── System Logs
```

## 6. Agent Editor V1

v1.5.5 后，Agent Editor 简化为：

```text
Basic
├── name
├── slug
├── description
└── avatarUrl

Social
├── galleryImages[]
└── galleryVideos[]

Brain
└── modelProfileId

Voice
└── voiceProfileId

Config
└── config.prompt

Test
├── text reply test
└── voice reply test

Publish
└── version / release note
```

不再包含：

```text
Persona Builder
Capability Selector
Tool Skill Selector
Behavior Policy Builder
```

这些属于 V2。

## 7. Studio 创建 Agent 流程

```text
填写基础信息
↓
填写图片和视频路径
↓
选择大模型
↓
选择音色
↓
填写 Config Prompt
↓
测试文字回复
↓
测试语音回复
↓
发布
```

## 8. 前端目录建议

```text
dashboard/src/modules/
├── auth
├── agents
├── chat
├── devices
├── usage
└── settings

studio/src/modules/
├── agents
├── model-profiles
├── voice-profiles
├── users
├── usage
└── system
```

Skill Profile 前端模块不进入 V1。
---

# Web Audio Cache Policy

V1 Web 客户端需要支持 IndexedDB 音频缓存。

```text
messages 文字历史来自 Core
assistant 语音来自 Core 临时音频
Web 下载后按 messageId 存入 IndexedDB
换电脑或清除浏览器数据后，本地语音不可用
```

历史消息 UI 需要支持三种状态：

```text
有本地语音：显示播放按钮
无本地语音：显示“语音不在当前设备”
可重新生成：显示“重新生成语音”
```


---

## v1.5.7 Auth UI

V1 用户注册页使用邮箱验证码流程：

```text
输入邮箱
↓
点击发送验证码
↓
输入验证码、密码、昵称
↓
完成注册并自动登录
```

登录页使用：

```text
邮箱 + 密码
```

Studio 管理员登录页同样使用邮箱 + 密码，但管理员账号来自后端环境变量。普通用户不能注册成为管理员。

---

# v1.5.8 Agent Tokens UI

Dashboard 需要展示：

```text
当前 Agent Tokens 余额
本轮消耗 Agent Tokens
文字模式是否可用
语音模式是否可用
余额不足时的充值提示
```

Studio 用户管理需要展示：

```text
用户邮箱
昵称
最后上线时间
Agent Tokens 余额
累计消耗 Agent Tokens
用量明细入口
管理员手动调整余额入口
```

V1 充值页仅展示套餐，不接真实支付：

```text
5 RMB = 5000 Agent Tokens
10 RMB = 10000 Agent Tokens
30 RMB = 30000 Agent Tokens
50 RMB = 50000 Agent Tokens
100 RMB = 100000 Agent Tokens
```
