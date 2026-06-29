import { Injectable } from '@nestjs/common';
import { RuntimeContext } from '../context/runtime-context.types';

@Injectable()
export class PromptAssemblerService {
  assemble(context: RuntimeContext): string {
    const recent = context.session.recentMessages
      .map((message) => `${message.role}: ${message.content}`)
      .join('\n');

    return [
      '[System]',
      context.agent.configPrompt,
      '',
      '[Session Summary]',
      context.session.summary ?? '暂无摘要。',
      '',
      '[Recent Conversation]',
      recent || '暂无最近对话。',
      '',
      '[User]',
      context.input.text,
    ].join('\n');
  }
}
