import { Module } from '@nestjs/common';
import { DEVICE_GATEWAY_PORT } from '../../common/tokens';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { MockDeviceGatewayAdapter } from './mock-device-gateway.adapter';
import { WebSocketDeviceGatewayAdapter } from './websocket-device-gateway.adapter';

@Module({
  imports: [AppConfigModule],
  providers: [
    MockDeviceGatewayAdapter,
    WebSocketDeviceGatewayAdapter,
    {
      provide: DEVICE_GATEWAY_PORT,
      inject: [AppConfigService, MockDeviceGatewayAdapter, WebSocketDeviceGatewayAdapter],
      useFactory: (config: AppConfigService, mock: MockDeviceGatewayAdapter, ws: WebSocketDeviceGatewayAdapter) => {
        return config.value.device.gatewayDriver === 'websocket' ? ws : mock;
      },
    },
  ],
  exports: [DEVICE_GATEWAY_PORT],
})
export class DeviceGatewayModule {}
