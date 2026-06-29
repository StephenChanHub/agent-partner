export interface DeviceOutboundEvent {
  type: string;
  payload: Record<string, unknown>;
  traceId?: string;
}

export interface DeviceGatewayPort {
  sendToDevice(deviceId: string, event: DeviceOutboundEvent): Promise<void>;
  broadcastToUser(userId: string, event: DeviceOutboundEvent): Promise<void>;
  isDeviceOnline(deviceId: string): Promise<boolean>;
}
