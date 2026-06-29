import { Injectable } from '@nestjs/common';

export interface RobotActionPolicyInput {
  action: 'MOVE' | 'TURN' | 'STOP' | 'FOLLOW_ME' | 'DOCK';
  isRemote?: boolean;
  obstacleClear?: boolean;
}

@Injectable()
export class BehaviorPolicyRuntimeService {
  compileBehaviorSummary(): string {
    return 'Be safe, accurate, and ask when uncertain. STOP has highest priority.';
  }

  canExecuteRobotAction(input: RobotActionPolicyInput): { allowed: boolean; reason?: string; requiresConfirmation?: boolean } {
    if (input.action === 'STOP') return { allowed: true };
    if (input.obstacleClear === false) return { allowed: false, reason: 'Obstacle is not clear.' };
    if (input.isRemote) return { allowed: true, requiresConfirmation: true };
    return { allowed: true };
  }
}
