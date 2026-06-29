import { Module } from '@nestjs/common';
import { ROBOT_COMMAND_PORT } from '../../common/tokens';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { DeviceGatewayModule } from '../device-gateway/device-gateway.module';
import { MockRobotTransportAdapter } from './mock-robot-transport.adapter';
import { WebSocketRobotTransportAdapter } from './websocket-robot-transport.adapter';

@Module({
  imports: [AppConfigModule, DeviceGatewayModule],
  providers: [
    MockRobotTransportAdapter,
    WebSocketRobotTransportAdapter,
    {
      provide: ROBOT_COMMAND_PORT,
      inject: [AppConfigService, MockRobotTransportAdapter, WebSocketRobotTransportAdapter],
      useFactory: (config: AppConfigService, mock: MockRobotTransportAdapter, ws: WebSocketRobotTransportAdapter) => {
        return config.value.robot.transportDriver === 'websocket' ? ws : mock;
      },
    },
  ],
  exports: [ROBOT_COMMAND_PORT],
})
export class RobotTransportModule {}
