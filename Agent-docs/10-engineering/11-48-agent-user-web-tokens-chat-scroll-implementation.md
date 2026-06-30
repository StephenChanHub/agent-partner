# 11-48 Agent User Web Tokens & Chat Scroll Implementation

Version: v1.8.15

## Updated files

```text
Agent-user web/src/pages/HomePage.css
Agent-user web/src/pages/ChatPage.tsx
Agent-user web/src/pages/ChatPage.css
Agent-user web/README.md
README.md
```

## Implementation notes

### Tokens styling

`Tokens` is kept as a semantic label but styled with a stronger font weight across both home and chat views. This preserves the current UI language while preparing the label for future wallet integration.

### Chat animation

Message rows now use side-specific animation:

```text
messageDomEnterAgent
messageDomEnterUser
```

This provides directional feedback and makes the simulated chat flow closer to production behavior.

### Thinking-to-reply replacement

When a simulated Agent reply replaces the thinking state, the message id is changed from:

```text
msg_agent_thinking_<timestamp>
```

to:

```text
msg_agent_reply_<timestamp>
```

This forces React to mount a new DOM node, allowing the final Agent reply to receive the same entry animation.

### Scrollbar placement

The scroll container is now full-width, while individual message rows are centered with a max width. This moves the scrollbar to the browser's right side without making conversation content too wide.

```text
.chat-messages: full viewport width
.message-row: centered and max 860px
```

## Production readiness

This update remains UI-only. Future Core integration should replace the local `sendMessage` simulation with the runtime chat API while preserving the same message model and rendering behavior.
