import { Module } from '@nestjs/common';
import { STT_PORT } from '../../common/tokens';
import { MockSTTAdapter } from './mock-stt.adapter';

@Module({
  providers: [MockSTTAdapter, { provide: STT_PORT, useExisting: MockSTTAdapter }],
  exports: [STT_PORT],
})
export class STTModule {}
