import { Injectable } from '@nestjs/common';

export interface ShouldUpdateSummaryInput {
  messageCount: number;
  recentTokenEstimate?: number;
  force?: boolean;
}

@Injectable()
export class SessionSummaryService {
  shouldUpdate(input: ShouldUpdateSummaryInput): boolean {
    if (input.force) return true;
    if (input.recentTokenEstimate && input.recentTokenEstimate > 8000) return true;
    return input.messageCount > 0 && input.messageCount % 20 === 0;
  }

  async updateSummary(): Promise<string> {
    // v1.6 can call MockLLM; production will call LLM through the LLM port.
    return 'Mock session summary. Replace with LLM-generated rolling summary.';
  }
}
