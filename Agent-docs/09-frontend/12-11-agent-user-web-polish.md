# 12-11 Agent User Web Polish

版本：v1.8.1 User Web Polish & Git Ignore Baseline

## 目标

v1.8.1 对网页用户端首页进行视觉细节优化，使其更接近最终 C 端入口体验，同时保持当前阶段只做 DOM 和 UI，不接业务逻辑。

## 首页调整

### 删除中部 AI Partner 文本

页面保留主标题：

```text
Select your partner
```

移除中部小标题：

```text
AI Partner
```

左上角品牌仍然保留：

```text
DID Agent Partner
```

## 卡片比例

Agent 卡片统一采用：

```text
aspect-ratio: 3 / 4
```

设计基准为：

```text
900 x 1200
```

实际浏览器渲染会根据视口自适应缩放，保证比例不变。

## 头像策略

用户网页端继续执行全局头像策略：

```text
蓝色底：#0D21A5
白色首字符
不渲染图片头像
不开放头像上传
```

Agent 首页卡片头像取消外环，避免视觉过重。

头像图片字段与接口继续在模型和 API 层预留，后续正式上传能力接入后再开放。

## 蓝色规范

用户网页端全局主蓝色统一为：

```text
#0D21A5
```

适用范围：

```text
品牌文本
用户头像
Agent 头像
Agent 昵称
start 按钮
轮播指示器
蓝色光影
```

## 卡片阴影

v1.8.1 对卡片阴影进行了重新设计：

```text
更柔和的远距离蓝色阴影
更轻的深色层次阴影
保留 iOS 风格玻璃质感
减少硬边和过重阴影
```

## 左右滑动动画

当前不实现真实状态切换逻辑，但增加：

```text
scroll-snap 横向滑动
scroll-behavior: smooth
卡片进入动画
首张卡片轻微左右滑动提示动画
prefers-reduced-motion 降级支持
```

## 当前不做

```text
不接 API
不做登录
不进入聊天页
不保存 Agent 选择状态
不上传头像
不上传媒体
```
