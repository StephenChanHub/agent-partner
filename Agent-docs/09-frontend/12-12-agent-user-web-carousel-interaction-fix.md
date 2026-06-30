# 12-12 Agent User Web Carousel Interaction Fix

Version: v1.8.2

## Purpose

v1.8.2 修复用户网页端首页 Agent 卡片滑动异常问题，并把首页卡片切换从浏览器原生横向滚动升级为更可控的沙盒交互：

```text
手势滑动
+
点击目标卡片切换
```

当前仍然只实现 DOM 与 UI，不接后端接口。

## UI Changes

### Removed external visual container

卡片外部装载容器必须保持透明：

```text
background: transparent
box-shadow: none
```

这样页面视觉重点只落在 Agent 卡片本身，不再出现外层容器阴影或背景干扰。

### Card ratio

Agent 卡片继续采用：

```text
ratio: 3:4
reference: 900 x 1200
```

前端通过 `aspect-ratio: 3 / 4` 实现。

### Blue token

所有用户网页端主蓝色统一为：

```text
#0D21A5
```

包含：

```text
brand text
avatar background
agent name
start button
active dots
```

### Avatar policy

头像继续遵循平台统一策略：

```text
蓝色底 #0D21A5
白色首字符
无外环
不渲染图片头像
头像图片字段 / 接口预留但不开放
```

## Carousel Interaction

v1.8.2 不再使用 CSS scroll-snap 作为主要切换机制。

新的交互规则：

```text
左滑：切换到下一个 Agent
右滑：切换到上一个 Agent
点击左 / 右目标卡片：切换到被点击 Agent
点击 dot：切换到指定 Agent
```

当前只保存页面本地状态：

```text
activeIndex
```

不写入后端，不持久化。

## Agent Count

首页 Mock Agent 数量从 3 个增加到 5 个：

```text
Nexus
Luna
Aria
Orion
Mira
```

后续接入 Core API 时，页面可从 `GET /agents` 读取真实 Agent 列表。

## Out of Scope

v1.8.2 不实现：

```text
真实 API 请求
用户登录
进入聊天页
保存当前选择
头像上传
Agent 图片头像渲染
```
