import { Injectable } from '@nestjs/common';
import { DeviceGatewayPort, DeviceOutboundEvent } from './device-gateway.port';

@Injectable()
export class MockDeviceGatewayAdapter implements DeviceGatewayPort {
  async sendToDevice(deviceId: string, event: DeviceOutboundEvent): Promise<void> {
    console.log('[MockDeviceGateway] sendToDevice', { deviceId, event });
  }

  async broadcastToUser(userId: string, event: DeviceOutboundEvent): Promise<void> {
    console.log('[MockDeviceGateway] broadcastToUser', { userId, event });
  }

  async isDeviceOnline(_deviceId: string): Promise<boolean> {
    return true;
  }
}
