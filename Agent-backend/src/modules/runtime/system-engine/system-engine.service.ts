import { Injectable } from '@nestjs/common';
import { ActionResult, IntentResult, RuntimeContext } from '../types/runtime-context.types';

@Injectable()
export class SystemEngineService {
  async run(context: RuntimeContext, intent: IntentResult): Promise<ActionResult[]> {
    return [
      {
        type: 'SYSTEM_ACTION',
        status: 'SKIPPED',
        traceId: context.traceId,
        payload: { reason: 'System engine is stubbed in V1 sandbox.', intent },
      },
    ];
  }
}
