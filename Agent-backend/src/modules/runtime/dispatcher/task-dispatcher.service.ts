import { Injectable } from '@nestjs/common';
import { ChatEngineService } from '../chat-engine/chat-engine.service';
import { RobotEngineService } from '../robot-engine/robot-engine.service';
import { RuntimeContext } from '../types/runtime-context.types';

@Injectable()
export class TaskDispatcherService {
  constructor(
    private readonly chatEngine: ChatEngineService,
    private readonly robotEngine: RobotEngineService,
  ) {}

  async dispatch(context: RuntimeContext, intent: any) {
    if (intent?.type?.startsWith?.('ROBOT_')) return this.robotEngine.run(context, intent);
    return this.chatEngine.run(context, intent);
  }
}
