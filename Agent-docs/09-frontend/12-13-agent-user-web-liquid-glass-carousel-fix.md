# 12-13 Agent User Web Liquid Glass Carousel Fix

Version: v1.8.3

## 背景

v1.8.2 已经将用户首页改为手势轮播，但实际视觉和交互仍存在三个问题：

```text
1. 卡片底部仍然存在浅蓝色阴影，影响纯净视觉
2. 点击左右目标卡片切换不稳定
3. 卡片间距和标题到卡片的距离偏紧
```

v1.8.3 继续聚焦首页 UI/DOM，不接入任何业务逻辑。

## 目标

```text
删除卡片底部浅蓝色阴影
卡片外部容器保持透明
卡片自身改为 Liquid Glass 玻璃化背景
点击目标卡片可切换
手势滑动可切换
卡片间隔加大
标题到卡片的间隔加大
```

## Liquid Glass 策略

用户指定参考：

```text
https://github.com/rdev/liquid-glass-react.git
```

前端项目增加依赖：

```json
"liquid-glass-react": "^1.1.1"
```

页面使用默认参数，不暴露可调节配置：

```tsx
import LiquidGlass from 'liquid-glass-react';

<LiquidGlass>
  <div className="agent-card-content">...</div>
</LiquidGlass>
```

## 阴影策略

卡片本体不再使用蓝色外阴影。

```text
禁止使用 rgba(13, 33, 165, ...) 作为卡片外部阴影
禁止在卡片底部添加浅蓝色 glow
允许保留玻璃边框和内部高光
```

## 点击切换策略

除卡片自身 `onClick` 外，轮播容器增加左右点击区兜底：

```text
点击左侧 34% 区域：切换上一个 Agent
点击右侧 34% 区域：切换下一个 Agent
点击中间区域：不切换
```

这样可以避免因卡片层级、重叠或浏览器事件命中导致的“点击目标卡片无效”。

## 当前限制

```text
不接 API
不做登录逻辑
不进入聊天页
不上传头像 / 图片 / 音频
不保存真实选择结果
```
