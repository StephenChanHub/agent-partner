import { Injectable, Logger } from '@nestjs/common';
import { AppLoggerPort } from './app-logger.port';

@Injectable()
export class ConsoleLoggerAdapter implements AppLoggerPort {
  private readonly logger = new Logger('JarvisCore');

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(this.format(message, meta));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.log(this.format(message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(this.format(message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(this.format(message, meta));
  }

  private format(message: string, meta?: Record<string, unknown>) {
    return meta ? `${message} ${JSON.stringify(meta)}` : message;
  }
}
