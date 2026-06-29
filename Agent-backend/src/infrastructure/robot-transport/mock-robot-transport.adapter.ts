import { Injectable } from '@nestjs/common';
import { RobotCommand, RobotCommandPort, RobotCommandResult } from './robot-command.port';

@Injectable()
export class MockRobotTransportAdapter implements RobotCommandPort {
  async send(command: RobotCommand): Promise<RobotCommandResult> {
    console.log('[MockRobotTransport] send', command);
    return { accepted: true, status: 'SENT' };
  }

  async stop(deviceId: string, reason?: string): Promise<RobotCommandResult> {
    console.log('[MockRobotTransport] stop', { deviceId, reason });
    return { accepted: true, status: 'SENT' };
  }
}
