# 11-02 Module Skeleton v1.5.5

## 1. V1 模块清单

```text
src/modules/
├── auth/
├── users/
├── agents/
├── agent-sessions/
├── messages/
├── runtime/
├── devices/
├── model-profiles/
├── voice-profiles/
├── usage/
├── studio/
└── system/
```

## 2. V1 不包含

```text
skill-profiles/
tool-invocations/
payments/
media-assets/
robot-runtime/
```

Robot / Skill 相关模块可以保留文档和接口预留，但不进入 V1 实现。

## 3. Agents Module

负责：

```text
读取已发布 Agent
解析 Agent Manifest
给 Dashboard 返回基础信息和 social gallery
给 Runtime 提供 config.prompt / modelProfileId / voiceProfileId
```

## 4. Studio Module

负责：

```text
Agent Draft
Agent Manifest 保存
Agent 测试
Agent 发布
用户管理入口
```

## 5. Runtime Module

负责：

```text
文字聊天
语音聊天
Context Builder
Prompt Assembler
Usage Meter 调用
```

不负责真实工具调用。
