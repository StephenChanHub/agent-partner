export interface RobotCommand {
  actionId: string;
  deviceId: string;
  commandType: 'MOVE' | 'TURN' | 'STOP' | 'FOLLOW' | 'DOCK' | 'STATUS';
  payload: Record<string, unknown>;
  timeoutMs?: number;
  traceId?: string;
}

export interface RobotCommandResult {
  accepted: boolean;
  status: 'SENT' | 'REJECTED' | 'FAILED';
  reason?: string;
}

export interface RobotCommandPort {
  send(command: RobotCommand): Promise<RobotCommandResult>;
  stop(deviceId: string, reason?: string): Promise<RobotCommandResult>;
}
