import { Injectable } from '@nestjs/common';
import { mockSession } from '../../mock/mock-data';

@Injectable()
export class AgentSessionsService {
  current() {
    return mockSession;
  }

  createOrGet(agentSlug: string) {
    return { ...mockSession, agentSlug };
  }

  messages(sessionId: string) {
    return {
      sessionId,
      items: [
        { id: 'msg_mock_001', role: 'user', content: '你好 Jarvis', inputMode: 'text', createdAt: new Date().toISOString() },
        { id: 'msg_mock_002', role: 'assistant', content: '你好，我是 Jarvis。', responseMode: 'text', createdAt: new Date().toISOString() },
      ],
    };
  }
}
