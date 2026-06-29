export type RuntimeMode = 'TEXT' | 'VOICE';

export type RuntimeMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type IntentResult = {
  type: string;
  confidence?: number;
  slots?: Record<string, unknown>;
  raw?: unknown;
};

export type ActionResult = {
  type: string;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  traceId?: string;
  payload?: Record<string, unknown>;
};

export type RuntimeContext = {
  traceId: string;
  event?: { id?: string; type?: string; source?: string };
  payload?: Record<string, unknown>;
  agentSessionId: string;
  input: {
    text: string;
    mode: RuntimeMode;
    sourceClient?: 'WEB' | 'DEVICE' | 'STUDIO' | 'SYSTEM';
  };
  agent?: {
    id?: string;
    slug?: string;
    configPrompt?: string;
    manifest?: {
      identity?: { name?: string; description?: string; avatarUrl?: string };
      model?: { profileId?: string };
      voice?: { profileId?: string };
      config?: { prompt?: string };
      prompt?: { system?: string };
    };
  };
  session?: {
    id?: string;
    summary?: string;
    recentMessages?: RuntimeMessage[];
  };
  recentMessages: RuntimeMessage[];
};
