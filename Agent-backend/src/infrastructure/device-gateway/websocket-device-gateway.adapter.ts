import { Injectable } from '@nestjs/common';
import { DeviceGatewayPort, DeviceOutboundEvent } from './device-gateway.port';

@Injectable()
export class WebSocketDeviceGatewayAdapter implements DeviceGatewayPort {
  async sendToDevice(deviceId: string, event: DeviceOutboundEvent): Promise<void> {
    // v1.5 skeleton: connect this to Nest WebSocket Gateway in v1.6.
    console.log('[WebSocketDeviceGateway] sendToDevice', { deviceId, event });
  }

  async broadcastToUser(userId: string, event: DeviceOutboundEvent): Promise<void> {
    console.log('[WebSocketDeviceGateway] broadcastToUser', { userId, event });
  }

  async isDeviceOnline(_deviceId: string): Promise<boolean> {
    return false;
  }
}
