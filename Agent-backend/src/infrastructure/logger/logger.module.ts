import { Module } from '@nestjs/common';
import { APP_LOGGER } from '../../common/tokens';
import { ConsoleLoggerAdapter } from './console-logger.adapter';

@Module({
  providers: [
    ConsoleLoggerAdapter,
    { provide: APP_LOGGER, useExisting: ConsoleLoggerAdapter },
  ],
  exports: [APP_LOGGER],
})
export class LoggerModule {}
