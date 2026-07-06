import { useEffect, useMemo, useRef, useState } from 'react';
import { AgentFlipCard } from '../components/AgentFlipCard';
import { InitialAvatar } from '../components/InitialAvatar';
import { type HomeAgent } from '../config/agents';
import { isUserLoggedIn, requestUserAuth, updateUserSession, useUserSession } from '../state/userSession';
import { apiGet, apiPost } from '../utils/apiClient';
import { marked } from 'marked';
import './ChatPage.css';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

function renderMarkdown(text: string): string {
  try {
    return marked.parse(text) as string;
  } catch {
    return text;
  }
}

type ChatPageProps = {
  agent: HomeAgent;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'agent';
  text: string;
  status?: 'thinking' | 'ready';
  audioUrl?: string;
};

type ChatApiResponse = {
  sessionId: string;
  userMessage: { id: string; role: string; content: string };
  assistantMessage: { id: string; role: string; content: string };
  llmError?: { code: 'NETWORK_ERROR' | 'QUOTA_EXCEEDED' | 'NO_RESPONSE' };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costAgentTokens: number;
    balanceBefore: number;
    balanceAfter: number;
    provider: string;
    model: string;
  };
  mode: string;
};

type SessionMessagesResponse = {
  sessionId: string;
  items: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
};

function goBackHome() {
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new Event('agent-user-web:navigate'));
}

function goToWallet() {
  window.history.pushState({}, '', '/wallet');
  window.dispatchEvent(new Event('agent-user-web:navigate'));
}

function getStatusLabel(status?: ChatMessage['status']) {
  if (status === 'thinking') return 'thinking';
  if (status === 'ready') return 'ready';
  return '';
}

type ChatFailureKind = 'network' | 'quota' | 'no_response' | 'insufficient_balance' | 'auth';

const CHAT_FAILURE_MESSAGES: Record<Exclude<ChatFailureKind, 'auth'>, string> = {
  network: 'Network error. Please check your connection and try again.',
  quota: 'Model quota exceeded. Please try again later.',
  no_response: 'The model did not respond. Please try again.',
  insufficient_balance: 'Insufficient balance. Please top up to continue chatting.',
};

function mapLlmErrorCode(code: string): Exclude<ChatFailureKind, 'auth'> {
  switch (code) {
    case 'NETWORK_ERROR':
      return 'network';
    case 'QUOTA_EXCEEDED':
      return 'quota';
    case 'NO_RESPONSE':
      return 'no_response';
    default:
      return 'no_response';
  }
}

function isLegacyLlmFailureContent(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  return normalized === 'llm connection failed.' || normalized === 'llm connection failed';
}

function classifyRequestError(error: unknown): ChatFailureKind {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

  if (
    error instanceof TypeError ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('fetch failed')
  ) {
    return 'network';
  }

  if (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('rate_limit') ||
    message.includes('insufficient_quota') ||
    message.includes('exceeded')
  ) {
    return 'quota';
  }

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('no response') ||
    message.includes('empty response')
  ) {
    return 'no_response';
  }

  if (
    message.includes('余额不足') ||
    message.includes('insufficient') ||
    message.includes('充值') ||
    message.includes('top up')
  ) {
    return 'insufficient_balance';
  }

  if (
    message.includes('登录') ||
    message.includes('login') ||
    message.includes('unauthorized') ||
    message.includes('未授权')
  ) {
    return 'auth';
  }

  if (/\b50[0-9]\b/.test(message) || message.includes('503') || message.includes('502')) {
    return 'network';
  }

  return 'no_response';
}

function resolveChatFailureMessage(kind: Exclude<ChatFailureKind, 'auth'>): string {
  return CHAT_FAILURE_MESSAGES[kind];
}

const ENTER_LONG_PRESS_MS = 400;

function isMobileComposerInput() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

function insertTextareaNewline(element: HTMLTextAreaElement, onUpdate: (value: string) => void) {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? element.value.length;
  const next = `${element.value.slice(0, start)}\n${element.value.slice(end)}`;
  onUpdate(next);
  requestAnimationFrame(() => {
    element.selectionStart = start + 1;
    element.selectionEnd = start + 1;
  });
}

function buildAgentIntroMessage(agent: HomeAgent): ChatMessage {
  const description = agent.description?.trim() || 'I am ready to chat with you.';
  return {
    id: `agent_intro_${agent.id}_${agent.slug}`,
    role: 'agent',
    text: `Hi, I’m ${agent.name}. ${description}`,
    status: 'ready',
    audioUrl: agent.voicePreviewAudioUrl || undefined,
  };
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 7.25C8 5.455 9.455 4 11.25 4h5.5C18.545 4 20 5.455 20 7.25v5.5C20 14.545 18.545 16 16.75 16h-5.5C9.455 16 8 14.545 8 12.75v-5.5Z" />
      <path d="M4 11.25C4 9.455 5.455 8 7.25 8H8v4.75A3.25 3.25 0 0 0 11.25 16H16v.75C16 18.545 14.545 20 12.75 20h-5.5C5.455 20 4 18.545 4 16.75v-5.5Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8.25 6.625c0-1.284 1.394-2.084 2.504-1.438l8.038 4.688c1.1.642 1.1 2.233 0 2.875l-8.038 4.688c-1.11.647-2.504-.154-2.504-1.438V6.625Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.5 5.75A1.75 1.75 0 0 1 9.25 4h.5a1.75 1.75 0 0 1 1.75 1.75v12.5A1.75 1.75 0 0 1 9.75 20h-.5a1.75 1.75 0 0 1-1.75-1.75V5.75Z" />
      <path d="M12.5 5.75A1.75 1.75 0 0 1 14.25 4h.5a1.75 1.75 0 0 1 1.75 1.75v12.5A1.75 1.75 0 0 1 14.75 20h-.5a1.75 1.75 0 0 1-1.75-1.75V5.75Z" />
    </svg>
  );
}

function SoundWaveIcon() {
  return (
    <svg className="sound-wave-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8.6 8.4a4.9 4.9 0 0 1 0 7.2" />
      <path d="M12.1 6.1a8.2 8.2 0 0 1 0 11.8" />
      <path d="M15.7 3.9a11.4 11.4 0 0 1 0 16.2" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 4.75a1.2 1.2 0 0 1 .86.36l5.05 5.16a1.2 1.2 0 1 1-1.72 1.68l-2.99-3.05v9.15a1.2 1.2 0 1 1-2.4 0V8.9l-2.99 3.05a1.2 1.2 0 1 1-1.72-1.68l5.05-5.16a1.2 1.2 0 0 1 .86-.36Z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.75A3.25 3.25 0 0 0 8.75 7v4a3.25 3.25 0 0 0 6.5 0V7A3.25 3.25 0 0 0 12 3.75Z" />
      <path d="M6.3 10.4a1.05 1.05 0 0 1 1.05 1.05 4.65 4.65 0 0 0 9.3 0 1.05 1.05 0 1 1 2.1 0 6.75 6.75 0 0 1-5.7 6.67v1.08h2.25a1.05 1.05 0 1 1 0 2.1H8.7a1.05 1.05 0 1 1 0-2.1h2.25v-1.08a6.75 6.75 0 0 1-5.7-6.67A1.05 1.05 0 0 1 6.3 10.4Z" />
    </svg>
  );
}

export function ChatPage({ agent }: ChatPageProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const session = useUserSession();
  const introMessage = useMemo(() => buildAgentIntroMessage(agent), [agent]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [introMessage]);
  const [draft, setDraft] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesRef = useRef<HTMLElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
  const enterPressStartedAtRef = useRef<number | null>(null);
  const enterLongPressFiredRef = useRef(false);
  const enterLongPressTimerRef = useRef<number | null>(null);

  const adjustDraftHeight = () => {
    const element = draftInputRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const clearEnterPressState = () => {
    if (enterLongPressTimerRef.current !== null) {
      window.clearTimeout(enterLongPressTimerRef.current);
      enterLongPressTimerRef.current = null;
    }
    enterPressStartedAtRef.current = null;
    enterLongPressFiredRef.current = false;
  };

  const insertDraftNewline = () => {
    const element = draftInputRef.current;
    if (!element) return;
    insertTextareaNewline(element, setDraft);
    requestAnimationFrame(() => adjustDraftHeight());
  };

  const handleDraftKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;

    if (isMobileComposerInput()) {
      event.preventDefault();
      if (enterPressStartedAtRef.current !== null) return;

      enterPressStartedAtRef.current = Date.now();
      enterLongPressFiredRef.current = false;
      enterLongPressTimerRef.current = window.setTimeout(() => {
        enterLongPressFiredRef.current = true;
        insertDraftNewline();
        enterLongPressTimerRef.current = null;
      }, ENTER_LONG_PRESS_MS);
      return;
    }

    event.preventDefault();
    sendMessage();
  };

  const handleDraftKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || !isMobileComposerInput()) return;
    if (enterPressStartedAtRef.current === null) return;

    event.preventDefault();

    if (enterLongPressTimerRef.current !== null) {
      window.clearTimeout(enterLongPressTimerRef.current);
      enterLongPressTimerRef.current = null;
    }

    const shouldSend = !enterLongPressFiredRef.current;
    clearEnterPressState();

    if (shouldSend) {
      sendMessage();
    }
  };

  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load persisted messages from backend on mount
  useEffect(() => {
    if (!isUserLoggedIn(session)) {
      setMessages([introMessage]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Get or create session
        const sess: any = await apiPost('/agent-sessions', { agentSlug: agent.slug });
        if (cancelled || !sess?.id) return;
        setSessionId(sess.id);

        // Load messages
        const msgData: any = await apiGet(`/agent-sessions/${sess.id}/messages`);
        const items = msgData?.items ?? [];
        const loaded: ChatMessage[] = items
          .filter((m: any) => m.content?.trim())
          .map((m: any) => ({
            id: m.id,
            role: m.role === 'user' ? 'user' : 'agent',
            text: m.content,
            status: 'ready' as const,
          }));
        if (loaded.length > 0) {
          setMessages(loaded);
        } else {
          setMessages([introMessage]);
        }
      } catch {
        setMessages([introMessage]);
      }
    })();
    return () => { cancelled = true; };
  }, [agent.slug, session.isLoggedIn, session.accessToken]);

  useEffect(() => {
    audioRef.current?.pause();
    setPlayingMessageId(null);
    setInsufficientBalance(false);
    setSessionId(null);
  }, [introMessage]);

  useEffect(() => {
    const element = messagesRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    adjustDraftHeight();
  }, [draft]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      clearEnterPressState();
    };
  }, []);

  const handleCopyMessage = async (message: ChatMessage) => {
    try {
      await copyTextToClipboard(message.text);
      setCopiedMessageId(message.id);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedMessageId(null);
        copyTimerRef.current = null;
      }, 1200);
    } catch (error) {
      console.error('Copy message failed', error);
    }
  };

  const toggleMessageAudio = (message: ChatMessage) => {
    if (!message.audioUrl) return;

    if (playingMessageId === message.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingMessageId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(message.audioUrl);
    audioRef.current = audio;
    setPlayingMessageId(message.id);
    audio.addEventListener('ended', () => setPlayingMessageId(null), { once: true });
    audio.addEventListener('pause', () => {
      if (audioRef.current === audio && !audio.ended) setPlayingMessageId(null);
    });
    void audio.play().catch((error) => {
      console.error('Play message audio failed', error);
      if (audioRef.current === audio) audioRef.current = null;
      setPlayingMessageId(null);
    });
  };

  const requireLogin = () => {
    if (isUserLoggedIn(session)) return false;
    requestUserAuth();
    return true;
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;
    if (requireLogin()) return;

    const now = Date.now();
    const userMessage: ChatMessage = {
      id: `msg_user_${now}`,
      role: 'user',
      text,
    };
    const thinkingMessage: ChatMessage = {
      id: `msg_agent_thinking_${now}`,
      role: 'agent',
      text: `${agent.name} is thinking…`,
      status: 'thinking',
    };

    setMessages((current) => [...current, userMessage, thinkingMessage]);
    setDraft('');
    setInsufficientBalance(false);

    try {
      const result = await apiPost<ChatApiResponse>('/chat', {
        agentSlug: agent.slug,
        message: text,
        sessionId: sessionId,
        client: 'web',
      });

      const llmFailureKind = result.llmError?.code
        ? mapLlmErrorCode(result.llmError.code)
        : isLegacyLlmFailureContent(result.assistantMessage.content)
          ? 'no_response'
          : null;

      if (llmFailureKind) {
        setMessages((current) =>
          current.map((msg) =>
            msg.id === thinkingMessage.id
              ? { ...msg, text: resolveChatFailureMessage(llmFailureKind), status: 'ready' }
              : msg,
          ),
        );
        if (result.sessionId) setSessionId(result.sessionId);
        return;
      }

      // Replace the thinking message with the real response
      const assistantMessage: ChatMessage = {
        id: result.assistantMessage.id,
        role: 'agent',
        text: result.assistantMessage.content,
        status: 'ready',
      };

      setMessages((current) =>
        current.map((msg) =>
          msg.id === thinkingMessage.id ? assistantMessage : msg,
        ),
      );

      // Persist session ID for subsequent messages
      if (result.sessionId) setSessionId(result.sessionId);

      // Update session token balance
      updateUserSession({ tokens: result.usage.balanceAfter });
    } catch (error: unknown) {
      const failureKind = classifyRequestError(error);

      if (failureKind === 'insufficient_balance') {
        setInsufficientBalance(true);
        setMessages((current) =>
          current.map((msg) =>
            msg.id === thinkingMessage.id
              ? { ...msg, text: resolveChatFailureMessage('insufficient_balance'), status: 'ready' }
              : msg,
          ),
        );
      } else if (failureKind === 'auth') {
        setMessages((current) => current.filter((msg) => msg.id !== thinkingMessage.id));
        requestUserAuth();
      } else {
        setMessages((current) =>
          current.map((msg) =>
            msg.id === thinkingMessage.id
              ? { ...msg, text: resolveChatFailureMessage(failureKind), status: 'ready' }
              : msg,
          ),
        );
      }
    }
  };

  return (
    <main className="chat-shell">
      <header className="chat-header">
        <button className="chat-back-button" type="button" aria-label="Back to agents" onClick={goBackHome}>
          ←
        </button>

        <button
          className="chat-agent-title"
          type="button"
          aria-label={`Open ${agent.name} card`}
          onClick={() => setIsProfileOpen(true)}
        >
          <InitialAvatar name={agent.name} size="sm" className="chat-agent-avatar" />
          <span>{agent.name}</span>
        </button>

        <button className="chat-token-badge" type="button" aria-label="Open token wallet" onClick={goToWallet}>
          <img className="chat-token-logo" src="/Tokens.png" alt="" aria-hidden="true" />
          <span className="chat-token-word">Tokens</span>{" x "}{session.tokens.toLocaleString('en-US')}
        </button>
      </header>

      <section ref={messagesRef} className="chat-messages" aria-label="Conversation preview">
        {messages.map((message) => {
          const statusLabel = getStatusLabel(message.status);
          const isPlaying = playingMessageId === message.id;
          return (
            <article key={message.id} className={`message-row message-row--${message.role}`}>
              <div className="message-row-content">
                <div className="message-stack">
                  <div className={`message-bubble message-bubble--${message.role}`}>
                    {message.status === 'thinking' ? (
                      <div className="thinking-line" aria-label="Agent is thinking">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                    {message.role === 'agent' && message.status !== 'thinking' ? (
                      <div
                        className="message-markdown"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
                      />
                    ) : (
                      <p>{message.text}</p>
                    )}
                  </div>

                  <div className="message-meta-line">
                    {statusLabel ? <span className={`message-status message-status--${message.status}`}>{statusLabel}</span> : <span />}
                    <div className="message-actions" aria-label="Message actions">
                      <button
                        className="message-icon-button"
                        type="button"
                        aria-label="Copy message"
                        title={copiedMessageId === message.id ? 'Copied' : 'Copy'}
                        onClick={() => void handleCopyMessage(message)}
                      >
                        <CopyIcon />
                      </button>
                      {/*
                      {message.audioUrl ? (
                        <button
                          className={`message-icon-button${isPlaying ? ' message-icon-button--playing' : ''}`}
                          type="button"
                          aria-label={isPlaying ? 'Pause message audio' : 'Play message audio'}
                          title={isPlaying ? 'Pause' : 'Play'}
                          onClick={() => toggleMessageAudio(message)}
                        >
                          {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                      ) : null}
                      */}
                    </div>
                  </div>
                </div>

                {message.audioUrl ? (
                  <button
                    className={`message-sound-button sound-button${isPlaying ? ' message-sound-button--playing' : ''}`}
                    type="button"
                    aria-label={isPlaying ? 'Pause message audio' : 'Play message audio'}
                    title={isPlaying ? 'Pause' : 'Play'}
                    onClick={() => toggleMessageAudio(message)}
                  >
                    <SoundWaveIcon />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {insufficientBalance ? (
        <div className="chat-balance-warning" role="alert">
          <span>Insufficient balance. Please top up to continue chatting.</span>
          <button type="button" onClick={goToWallet}>Top up</button>
        </div>
      ) : null}

      <footer className="chat-composer">
        <div className="chat-composer-inner">
          <div className="chat-input-shell">
            <textarea
              ref={draftInputRef}
              rows={1}
              enterKeyHint="send"
              placeholder="Message your partner…"
              aria-label="Message input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              onKeyUp={handleDraftKeyUp}
              onBlur={clearEnterPressState}
            />
            <button className="send-input-button" type="button" aria-label="Send message" onClick={sendMessage}>
              <ArrowUpIcon />
            </button>
          </div>
          <button className="voice-input-button" type="button" aria-label="Voice input" onClick={requireLogin}>
            <MicIcon />
          </button>
        </div>
      </footer>

      {copiedMessageId ? (
        <output className="copy-toast" role="status" aria-live="polite">
          Copied!
        </output>
      ) : null}

      {isProfileOpen ? (
        <div className="agent-profile-overlay" role="presentation" onClick={() => setIsProfileOpen(false)}>
          <div className="agent-profile-card-mount" onClick={(event) => event.stopPropagation()}>
            <AgentFlipCard
              agent={agent}
              mode="standalone"
              isActive
              isVisible
              distance={0}
              showStartButton={false}
              className="chat-shared-profile-card agent-card--solid"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
