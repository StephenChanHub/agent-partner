import { Injectable } from '@nestjs/common';
import { ActionResult, IntentResult, RuntimeContext } from '../types/runtime-context.types';

@Injectable()
export class RobotEngineService {
  async run(context: RuntimeContext, intent?: IntentResult): Promise<ActionResult[]> {
    return [
      {
        type: 'ROBOT_ACTION',
        status: 'SKIPPED',
        traceId: context.traceId,
        payload: { reason: 'Robot action is not enabled in V1 sandbox.', intent },
      },
    ];
  }
}
