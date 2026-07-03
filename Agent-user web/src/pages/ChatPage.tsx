import { useEffect, useMemo, useRef, useState } from 'react';
import { AgentFlipCard } from '../components/AgentFlipCard';
import { InitialAvatar } from '../components/InitialAvatar';
import { type HomeAgent } from '../config/agents';
import { useUserSession } from '../state/userSession';
import './ChatPage.css';

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

  useEffect(() => {
    audioRef.current?.pause();
    setPlayingMessageId(null);
    setMessages([introMessage]);
  }, [introMessage]);

  useEffect(() => {
    const element = messagesRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
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

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

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
          <span className="chat-token-word">Tokens</span>：{session.tokens.toLocaleString('en-US')}
        </button>
      </header>

      <section ref={messagesRef} className="chat-messages" aria-label="Conversation preview">
        {messages.map((message) => {
          const statusLabel = getStatusLabel(message.status);
          const isPlaying = playingMessageId === message.id;
          return (
            <article key={message.id} className={`message-row message-row--${message.role}`}>
              <div className="message-stack">
                <div className={`message-bubble message-bubble--${message.role}`}>
                  {message.status === 'thinking' ? (
                    <div className="thinking-line" aria-label="Agent is thinking">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                  <p>{message.text}</p>
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
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <footer className="chat-composer">
        <div className="chat-composer-inner">
          <div className="chat-input-shell">
            <input
              type="text"
              placeholder="Message your partner…"
              aria-label="Message input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button className="send-input-button" type="button" aria-label="Send message" onClick={sendMessage}>
              <ArrowUpIcon />
            </button>
          </div>
          <button className="voice-input-button" type="button" aria-label="Voice input">
            <MicIcon />
          </button>
        </div>
      </footer>

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
