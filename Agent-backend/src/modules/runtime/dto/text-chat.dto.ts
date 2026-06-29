export class TextChatDto {
  agentSlug?: string;
  sessionId?: string;
  message!: string;
  client?: 'web' | 'device' | 'studio';
}
