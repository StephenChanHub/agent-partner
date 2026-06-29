import { Inject, Injectable } from '@nestjs/common';
import { DEVICE_GATEWAY_PORT } from '../../common/tokens';
import { DeviceGatewayPort } from '../device-gateway/device-gateway.port';
import { RobotCommand, RobotCommandPort, RobotCommandResult } from './robot-command.port';

@Injectable()
export class WebSocketRobotTransportAdapter implements RobotCommandPort {
  constructor(
    @Inject(DEVICE_GATEWAY_PORT) private readonly deviceGateway: DeviceGatewayPort,
  ) {}

  async send(command: RobotCommand): Promise<RobotCommandResult> {
    await this.deviceGateway.sendToDevice(command.deviceId, {
      type: 'ROBOT_ACTION_COMMAND',
      payload: command as unknown as Record<string, unknown>,
      traceId: command.traceId,
    });
    return { accepted: true, status: 'SENT' };
  }

  async stop(deviceId: string, reason?: string): Promise<RobotCommandResult> {
    await this.deviceGateway.sendToDevice(deviceId, {
      type: 'FORCE_STOP',
      payload: { reason },
    });
    return { accepted: true, status: 'SENT' };
  }
}
