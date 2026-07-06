import { useEffect, useMemo, useRef, useState } from 'react';
import { AgentFlipCard } from '../components/AgentFlipCard';
import { InitialAvatar } from '../components/InitialAvatar';
import { type HomeAgent } from '../config/agents';
import { isUserLoggedIn, requestUserAuth, updateUserSession, useUserSession } from '../state/userSession';
import { apiGet, apiPost, getApiAuthHeaders, resolveApiUrl } from '../utils/apiClient';
import { marked } from 'marked';
import './ChatPage.css';

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type VoiceAudioCacheRecord = {
  messageId: string;
  audioBlob: Blob;
  mimeType: string;
  createdAt: string;
};


const AUDIO_CACHE_DB = 'jarvis_audio_cache';
const AUDIO_CACHE_STORE = 'audio_messages';
const DEFAULT_STT_LANG = 'zh-CN';
const VOICE_SILENCE_AUTO_SEND_MS = 3000;
const VOICE_ACTIVITY_THRESHOLD = 0.035;

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
  audioMimeType?: string;
};

type ChatApiResponse = {
  sessionId: string;
  userMessage: { id: string; role: string; content: string };
  assistantMessage: { id: string; role: string; content: string };
  llmError?: { code: 'NETWORK_ERROR' | 'QUOTA_EXCEEDED' | 'NO_RESPONSE' };
  voice?: {
    audioUrl?: string;
    mimeType?: string;
    shouldCache?: boolean;
  };
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

type VoiceChatApiResponse = ChatApiResponse & {
  transcript?: string;
  audio?: {
    messageId: string;
    tempUrl?: string;
    mimeType?: string;
    storagePolicy?: 'PLAY_AND_DISCARD' | 'CLIENT_CACHE_OPTIONAL';
    expiresIn?: number;
  };
};

function getUserAudioUrl(audioBlob: Blob): string {
  return URL.createObjectURL(audioBlob);
}

function revokeAudioUrl(audioUrl?: string) {
  if (audioUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(audioUrl);
  }
}

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

function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

function openAudioCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUDIO_CACHE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_CACHE_STORE)) {
        db.createObjectStore(AUDIO_CACHE_STORE, { keyPath: 'messageId' });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function saveAudioToCache(record: VoiceAudioCacheRecord): Promise<void> {
  const db = await openAudioCacheDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(AUDIO_CACHE_STORE, 'readwrite');
      tx.objectStore(AUDIO_CACHE_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function loadAudioFromCache(messageId: string): Promise<VoiceAudioCacheRecord | null> {
  const db = await openAudioCacheDb();
  try {
    return await new Promise<VoiceAudioCacheRecord | null>((resolve, reject) => {
      const tx = db.transaction(AUDIO_CACHE_STORE, 'readonly');
      const request = tx.objectStore(AUDIO_CACHE_STORE).get(messageId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function blobFromResponse(response: Response): Promise<Blob> {
  const blob = await response.blob();
  return blob;
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

function RecordingWaveOrb() {
  return (
    <div className="voice-recording-orb" role="status" aria-live="polite" aria-label="Recording">
      <div className="voice-recording-orb__sphere" aria-hidden="true">
        <div className="voice-recording-orb__shine" />
        <svg className="voice-recording-orb__wave" viewBox="0 0 56 20" aria-hidden="true" focusable="false">
          <path
            className="voice-recording-orb__wave-path"
            d="M2 10 C7 4, 11 16, 16 10 C21 4, 25 16, 30 10 C35 4, 39 16, 44 10 C49 4, 53 16, 54 10"
          />
        </svg>
      </div>
    </div>
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
  const [isRecording, setIsRecording] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLElement | null>(null);
  const messageStateRef = useRef<ChatMessage[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
  const enterPressStartedAtRef = useRef<number | null>(null);
  const enterLongPressFiredRef = useRef(false);
  const enterLongPressTimerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const voiceAudioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const voiceAnimationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceTranscriptRef = useRef('');

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
        const loaded: ChatMessage[] = [];
        for (const m of items.filter((item: any) => item.content?.trim())) {
          const nextMessage: ChatMessage = {
            id: m.id,
            role: m.role === 'user' ? 'user' : 'agent',
            text: m.content,
            status: 'ready' as const,
          };
          try {
            const cached = await loadAudioFromCache(nextMessage.id);
            if (cached) {
              nextMessage.audioUrl = getUserAudioUrl(cached.audioBlob);
              nextMessage.audioMimeType = cached.mimeType;
            }
          } catch (error) {
            console.error('Load cached message audio failed', error);
          }
          loaded.push(nextMessage);
        }
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
    setSttSupported(getSpeechRecognitionConstructor() !== null);
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      clearEnterPressState();
      speechRecognitionRef.current?.abort();
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (silenceTimerRef.current !== null) window.clearTimeout(silenceTimerRef.current);
      if (voiceAnimationFrameRef.current !== null) window.cancelAnimationFrame(voiceAnimationFrameRef.current);
      void audioContextRef.current?.close();
      messageStateRef.current.forEach((message) => revokeAudioUrl(message.audioUrl));
    };
  }, []);

  useEffect(() => {
    messageStateRef.current = messages;
  }, [messages]);

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

  const sendMessage = async (voicePayload?: { text: string; audioBlob: Blob; mimeType: string }) => {
    const text = (voicePayload?.text ?? draft).trim();
    if (!text) return;
    if (requireLogin()) return;

    const useVoiceMode = Boolean(voicePayload?.audioBlob);

    const now = Date.now();
    const userMessage: ChatMessage = {
      id: `msg_user_${now}`,
      role: 'user',
      text,
      audioUrl: voicePayload ? getUserAudioUrl(voicePayload.audioBlob) : undefined,
      audioMimeType: voicePayload?.mimeType,
    };
    const thinkingMessage: ChatMessage = {
      id: `msg_agent_thinking_${now}`,
      role: 'agent',
      text: `${agent.name} is thinking…`,
      status: 'thinking',
    };

    setMessages((current) => [...current, userMessage, thinkingMessage]);
    if (voicePayload) {
      void saveAudioToCache({
        messageId: userMessage.id,
        audioBlob: voicePayload.audioBlob,
        mimeType: voicePayload.mimeType || voicePayload.audioBlob.type || 'audio/webm',
        createdAt: new Date().toISOString(),
      }).catch((error) => console.error('User audio cache save failed', error));
    }
    setDraft('');
    setInsufficientBalance(false);

    try {
      const result = await apiPost<ChatApiResponse | VoiceChatApiResponse>(useVoiceMode ? '/voice' : '/chat', {
        agentSlug: agent.slug,
        sessionId,
        client: 'web',
        ...(useVoiceMode
          ? { mockText: text, message: text, inputMode: 'voice', hasClientAudio: true }
          : { message: text }),
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

      const assistantMessage: ChatMessage = {
        id: result.assistantMessage.id,
        role: 'agent',
        text: result.assistantMessage.content,
        status: 'ready',
      };

      const voiceAudioUrl = resolveApiUrl(
        'audio' in result ? result.audio?.tempUrl : result.voice?.audioUrl,
      );
      const voiceMimeType = 'audio' in result ? result.audio?.mimeType : result.voice?.mimeType;
      const shouldCacheAudio = 'audio' in result ? result.audio?.storagePolicy !== 'PLAY_AND_DISCARD' : result.voice?.shouldCache !== false;

      if (voiceAudioUrl) {
        try {
          const response = await fetch(voiceAudioUrl, {
            headers: getApiAuthHeaders(),
          });
          const audioBlob = await blobFromResponse(response);
          const audioUrl = getUserAudioUrl(audioBlob);
          assistantMessage.audioUrl = audioUrl;

          if (shouldCacheAudio) {
            void saveAudioToCache({
              messageId: assistantMessage.id,
              audioBlob,
              mimeType: voiceMimeType || audioBlob.type || 'audio/mpeg',
              createdAt: new Date().toISOString(),
            }).catch((error) => {
              console.error('Audio cache save failed', error);
            });
          }
        } catch (error) {
          console.error('Fetch assistant audio failed', error);
        }
      }

      setMessages((current) => current.map((msg) => (msg.id === thinkingMessage.id ? assistantMessage : msg)));

      if (result.sessionId) setSessionId(result.sessionId);
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

  const clearVoiceSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopVoiceCapture = () => {
    clearVoiceSilenceTimer();
    if (voiceAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(voiceAnimationFrameRef.current);
      voiceAnimationFrameRef.current = null;
    }
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    speechRecognitionRef.current?.stop();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const armSilenceAutoSend = () => {
    clearVoiceSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      stopVoiceCapture();
    }, VOICE_SILENCE_AUTO_SEND_MS);
  };

  const monitorVoiceActivity = (stream: MediaStream) => {
    const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextConstructor) {
      armSilenceAutoSend();
      return;
    }

    const audioContext = new AudioContextConstructor();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        sum += normalized * normalized;
      }
      const volume = Math.sqrt(sum / samples.length);
      if (volume > VOICE_ACTIVITY_THRESHOLD) {
        armSilenceAutoSend();
      }
      voiceAnimationFrameRef.current = window.requestAnimationFrame(tick);
    };

    armSilenceAutoSend();
    tick();
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopVoiceCapture();
      return;
    }

    if (requireLogin()) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Voice recording is not supported in this browser.');
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser.');
      return;
    }

    setVoiceError(null);
    voiceTranscriptRef.current = '';
    voiceAudioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) voiceAudioChunksRef.current.push(event.data);
      };
      recorder.onerror = (event) => {
        console.error('Audio recording failed', event);
        setVoiceError('Audio recording failed. Please try again.');
      };
      recorder.onstop = () => {
        const chunks = voiceAudioChunksRef.current;
        const resolvedMimeType = recorder.mimeType || mimeType || chunks[0]?.type || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: resolvedMimeType });
        const transcript = (voiceTranscriptRef.current || draftInputRef.current?.value || draft).trim();

        setIsRecording(false);
        mediaRecorderRef.current = null;
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        if (audioBlob.size > 0 && transcript) {
          void sendMessage({ text: transcript, audioBlob, mimeType: resolvedMimeType });
        } else if (!transcript) {
          setVoiceError('No speech was detected. Please try again.');
        }
      };

      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;
      recognition.lang = DEFAULT_STT_LANG;
      recognition.continuous = true;
      recognition.interimResults = true;

      let finalTranscript = '';
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        const nextDraft = `${finalTranscript}${interimTranscript}`.trim();
        voiceTranscriptRef.current = nextDraft;
        setDraft(nextDraft);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition failed', event?.error);
        if (event?.error !== 'no-speech') {
          setVoiceError('Speech recognition failed. Please try again.');
        }
      };
      recognition.onend = () => {
        speechRecognitionRef.current = null;
        voiceTranscriptRef.current = (voiceTranscriptRef.current || finalTranscript).trim();
      };

      recorder.start();
      recognition.start();
      setIsRecording(true);
      monitorVoiceActivity(stream);
    } catch (error) {
      console.error('Start voice recording failed', error);
      setIsRecording(false);
      clearVoiceSilenceTimer();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      speechRecognitionRef.current = null;
      setVoiceError('Microphone permission is required for voice chat.');
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
                    className={`message-sound-button sound-button${message.role === 'user' ? ' message-sound-button--user' : ''}${isPlaying ? ' message-sound-button--playing' : ''}`}
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
        {isRecording ? <RecordingWaveOrb /> : null}
        {voiceError ? (
          <div className="voice-error" role="alert">
            {voiceError}
          </div>
        ) : null}
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
            <button className="send-input-button" type="button" aria-label="Send message" onClick={() => void sendMessage()}>
              <ArrowUpIcon />
            </button>
          </div>
          <button
            className={`voice-input-button${isRecording ? ' voice-input-button--recording' : ''}`}
            type="button"
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            title={sttSupported ? (isRecording ? 'Stop recording' : 'Start voice input') : 'Speech recognition is not supported in this browser'}
            onClick={() => void toggleRecording()}
            disabled={!sttSupported && !isRecording}
          >
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
