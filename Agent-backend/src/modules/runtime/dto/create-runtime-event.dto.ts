import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export enum RuntimeEventSource {
  DASHBOARD = 'DASHBOARD',
  DEVICE = 'DEVICE',
  STUDIO = 'STUDIO',
  SYSTEM = 'SYSTEM',
}

export enum RuntimeEventType {
  USER_MESSAGE = 'USER_MESSAGE',
  VOICE_COMMAND = 'VOICE_COMMAND',
  DEVICE_SIGNAL = 'DEVICE_SIGNAL',
  ROBOT_STATUS = 'ROBOT_STATUS',
}

export class CreateRuntimeEventDto {
  @IsEnum(RuntimeEventSource)
  source!: RuntimeEventSource;

  @IsEnum(RuntimeEventType)
  type!: RuntimeEventType;

  @IsOptional()
  @IsString()
  agentSessionId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
