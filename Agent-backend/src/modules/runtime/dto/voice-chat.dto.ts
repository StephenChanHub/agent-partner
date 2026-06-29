export class VoiceChatDto {
  agentSlug?: string;
  sessionId?: string;
  mockText?: string;
  client?: 'web' | 'device' | 'studio';
}
