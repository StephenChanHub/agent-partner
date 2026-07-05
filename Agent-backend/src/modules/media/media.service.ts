import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';

export type MediaKind = 'agent-image' | 'agent-video' | 'voice-preview' | 'agent-avatar';

const ALLOWED_KINDS: MediaKind[] = ['agent-image', 'agent-video', 'voice-preview', 'agent-avatar'];

@Injectable()
export class MediaService {
  readonly rootDir = process.env.MEDIA_STORAGE_DIR || join(process.cwd(), 'media-storage');

  constructor() {
    this.ensureRoot();
  }

  ensureRoot() {
    mkdirSync(this.rootDir, { recursive: true });
    ALLOWED_KINDS.forEach((kind) => mkdirSync(join(this.rootDir, kind), { recursive: true }));
  }

  normalizeKind(kind?: string): MediaKind {
    const value = String(kind || 'agent-image') as MediaKind;
    if (!ALLOWED_KINDS.includes(value)) return 'agent-image';
    return value;
  }

  makePublicUrl(kind: string, filename: string) {
    return `/media/files/${this.normalizeKind(kind)}/${basename(filename)}`;
  }

  getFilePath(kind: string, filename: string) {
    const safeKind = this.normalizeKind(kind);
    const safeName = basename(filename);
    const fullPath = join(this.rootDir, safeKind, safeName);
    if (!existsSync(fullPath)) throw new NotFoundException('Media file not found');
    return fullPath;
  }

  toFileInfo(kind: string, filename: string) {
    const safeKind = this.normalizeKind(kind);
    const safeName = basename(filename);
    const fullPath = this.getFilePath(safeKind, safeName);
    const stat = statSync(fullPath);
    return {
      id: `${safeKind}/${safeName}`,
      kind: safeKind,
      filename: safeName,
      originalName: safeName,
      mimeType: this.guessMimeType(safeName),
      sizeBytes: stat.size,
      url: this.makePublicUrl(safeKind, safeName),
      createdAt: stat.birthtime.toISOString(),
      updatedAt: stat.mtime.toISOString(),
    };
  }

  list(kind?: string) {
    this.ensureRoot();
    const kinds = kind ? [this.normalizeKind(kind)] : ALLOWED_KINDS;
    return kinds.flatMap((itemKind) => {
      const dir = join(this.rootDir, itemKind);
      if (!existsSync(dir)) return [];
      return readdirSync(dir)
        .filter((name) => !name.startsWith('.'))
        .map((name) => this.toFileInfo(itemKind, name))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  }

  buildUploadedInfo(file: any, kind?: string) {
    const safeKind = this.normalizeKind(kind || file?.fieldname);
    return {
      id: `${safeKind}/${file.filename}`,
      kind: safeKind,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      url: this.makePublicUrl(safeKind, file.filename),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  saveBuffer(kind: string, buffer: Buffer, extension = '.mp3') {
    this.ensureRoot();
    const safeKind = this.normalizeKind(kind);
    const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
    const filename = `${safeKind}-${Date.now()}${safeExt}`;
    const fullPath = join(this.rootDir, safeKind, filename);
    writeFileSync(fullPath, buffer);
    return this.toFileInfo(safeKind, filename);
  }

  private guessMimeType(filename: string) {
    const ext = extname(filename).toLowerCase();
    if (['.png'].includes(ext)) return 'image/png';
    if (['.jpg', '.jpeg'].includes(ext)) return 'image/jpeg';
    if (['.webp'].includes(ext)) return 'image/webp';
    if (['.gif'].includes(ext)) return 'image/gif';
    if (['.mp4'].includes(ext)) return 'video/mp4';
    if (['.mov'].includes(ext)) return 'video/quicktime';
    if (['.mp3'].includes(ext)) return 'audio/mpeg';
    if (['.wav'].includes(ext)) return 'audio/wav';
    if (['.m4a'].includes(ext)) return 'audio/mp4';
    return 'application/octet-stream';
  }
}
