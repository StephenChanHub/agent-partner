import { Injectable } from '@nestjs/common';
import { STTInput, STTPort, STTResult } from './stt.port';

@Injectable()
export class MockSTTAdapter implements STTPort {
  async transcribe(input: STTInput): Promise<STTResult> {
    return {
      text: 'Jarvis mock voice input',
      language: input.language ?? 'zh-CN',
      confidence: 1,
      provider: 'mock',
    };
  }
}
