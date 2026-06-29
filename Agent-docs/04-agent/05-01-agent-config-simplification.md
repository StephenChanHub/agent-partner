# Agent Config Simplification v1.5.5

## 1. 为什么要简化

在 v1.5.2 中，我们设计过完整的 Skill Library：

```text
Persona Profile
Capability Profile
Tool Skill
Behavior Policy
```

这个设计长期正确，但对 V1 来说太重。

当前 V1 的目标是：

```text
让用户可以选择 Agent，完成文字聊天和语音聊天。
```

暂时不做真实工具调用、不做机器人动作、不做复杂权限调度。因此，V1 没必要把 Agent 配置拆成多个资源库和多张表。

## 2. V1 的正确抽象

V1 直接采用：

```text
Agent = Model Profile + Voice Profile + Config Prompt + Social Gallery
```

其中：

| 部分 | 说明 |
|---|---|
| Model Profile | Agent 使用哪个大模型 |
| Voice Profile | Agent 使用哪个音色 |
| Config Prompt | Agent 的人格、能力、边界、专属设定 |
| Social Gallery | Agent 的照片墙和视频墙 |

## 3. Config Prompt 包含什么

V1 中，管理员在 Studio 里填写一整段配置提示词。

它应该描述：

```text
这个 Agent 是谁
它是什么性格
它擅长什么领域
它应该怎么回答
它不能做什么
它和用户的关系是什么
```

示例：

```text
你是 Jarvis，一名冷静、可靠、专业的个人 AI 助手。
你擅长帮助用户做产品设计、系统架构、代码规划和学习辅导。
你的回答风格应该清晰、直接、有结构。
如果信息不确定，你必须明确说明不确定。
你不能编造不存在的事实，也不能假装已经完成未完成的事情。
```

## 4. 为什么不拆字段

V1 不拆成：

```text
性别字段
年龄字段
性格字段
职业字段
能力等级字段
行为策略字段
```

原因：

```text
1. 这些字段最终还是要编译成提示词
2. V1 只做聊天，结构化字段收益有限
3. 表单复杂度会明显上升
4. Runtime 也会更复杂
5. 后续调整人设反而不如一段 Prompt 灵活
```

所以 V1 直接让管理员写一段高质量 `config.prompt`。

## 5. Social Gallery 为什么不放进 Config Prompt

照片和视频不是提示词。

它们是展示资产，用于 Agent 详情页：

```text
头像
简介
照片墙
视频墙
开始聊天按钮
```

因此它们放在：

```text
manifest.social.galleryImages[]
manifest.social.galleryVideos[]
```

而不是放在 `config.prompt` 里。

## 6. Studio 创建 Agent 的 V1 流程

```text
Basic：填写名称、简介、头像
↓
Social：填写图片和视频路径
↓
Brain：选择大模型
↓
Voice：选择音色并试听
↓
Config：填写 Agent 配置提示词
↓
Test：测试文字回复和语音回复
↓
Publish：发布 Agent
```

## 7. Runtime 使用方式

每次对话时：

```text
读取 Agent Manifest
↓
读取 config.prompt
↓
读取 Model Profile
↓
读取 Voice Profile
↓
读取 Agent Session Summary
↓
读取最近消息
↓
组装 Prompt
↓
调用大模型
↓
如需语音，调用 TTS
```

## 8. V2 再拆什么

当 V2 进入真实技能与工具调用时，再拆：

```text
Skill Library
Tool Permission
Behavior Policy
Robot Capability
External Tool Schema
Function Calling
```

V1 不做。
