import { BadRequestException, Controller, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { ok, paginated } from '../../common/api-response';
import { MediaService } from './media.service';

const MEDIA_ROOT = process.env.MEDIA_STORAGE_DIR || join(process.cwd(), 'media-storage');
const allowedMimePrefixes = ['image/', 'video/', 'audio/'];

function mediaKindFromRequest(req: any) {
  const raw = String(req.body?.kind || req.body?.mediaKind || req.query?.kind || 'agent-image');
  if (['agent-image', 'agent-video', 'voice-preview', 'agent-avatar'].includes(raw)) return raw;
  return 'agent-image';
}

@Controller()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('studio/media/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req: any, _file: any, cb: (error: Error | null, destination: string) => void) => {
        const kind = mediaKindFromRequest(req);
        const dir = join(MEDIA_ROOT, kind);
        mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
        const originalExt = extname(file.originalname || '').toLowerCase();
        const ext = originalExt || '.bin';
        cb(null, `${Date.now()}-${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
      const allowed = allowedMimePrefixes.some((prefix) => String(file.mimetype || '').startsWith(prefix));
      cb(allowed ? null : new BadRequestException('Only image, video and audio media files are allowed'), allowed);
    },
  }))
  upload(@UploadedFile() file: any, @Query('kind') kind?: string) {
    if (!file) throw new BadRequestException('Missing media file');
    return ok(this.media.buildUploadedInfo(file, kind));
  }

  @Get('studio/media/files')
  list(@Query('kind') kind?: string) {
    const items = this.media.list(kind);
    return paginated(items, { total: items.length });
  }

  @Get('media/files/:kind/:filename')
  file(@Param('kind') kind: string, @Param('filename') filename: string, @Res() res: any) {
    const filePath = this.media.getFilePath(kind, filename);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(filePath);
  }
}
