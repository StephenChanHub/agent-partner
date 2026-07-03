import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { mockSilentPreviewAudio, mockVoiceProfiles } from '../../mock/mock-data';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from './dto/update-voice-profile.dto';
import { TestVoiceProfileDto } from './dto/test-voice-profile.dto';

const DEFAULT_VOICE_PROFILE_ID = '00000000-0000-4000-8000-000000000101';

type ResourceStatus = 'ACTIVE' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED';

@Injectable()
export class VoiceProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query?: { status?: string }) {
    if (this.prisma.isMockMode) return this.listMock(query);
    await this.ensureDefaultVoiceProfile();
    const status = query?.status ? String(query.status).toUpperCase() : undefined;
    const items = await this.prisma.db.voiceProfile.findMany({
      where: status && status !== 'ALL' ? { status } : undefined,
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    return items.map((item: any) => this.toVoiceRecord(item));
  }

  async create(dto: CreateVoiceProfileDto & { status?: ResourceStatus }) {
    if (this.prisma.isMockMode) return this.createMock(dto);
    const previewAudioUrl = dto.previewAudioUrl ?? dto.previewUrl ?? '';
    const data = {
      provider: dto.provider,
      displayName: dto.displayName,
      voiceId: dto.voiceId,
      modelId: dto.modelId ?? (dto.provider === 'MOCK' ? 'mock-tts' : 'eleven_v3'),
      outputFormat: dto.outputFormat ?? 'mp3_44100_128',
      language: dto.language ?? 'zh-CN',
      description: dto.description ?? '',
      previewAudioUrl,
      defaultSpeed: dto.defaultSpeed ?? 1,
      defaultStability: dto.defaultStability ?? 0.5,
      defaultSimilarityBoost: dto.defaultSimilarityBoost ?? 0.75,
      status: this.normalizeStatus((dto as any).status, 'PUBLISHED'),
      isDefault: Boolean(dto.isDefault),
    };
    const saved = await this.prisma.db.$transaction(async (tx: any) => {
      if (data.isDefault) await tx.voiceProfile.updateMany({ data: { isDefault: false } });
      return tx.voiceProfile.create({ data });
    }).catch((error: any) => {
      if (String(error?.code) === 'P2002') throw new ConflictException('Voice provider and voiceId already exist');
      throw error;
    });
    return this.toVoiceRecord(saved);
  }

  async get(id: string) {
    if (this.prisma.isMockMode) return this.getMock(id);
    const item = await this.prisma.db.voiceProfile.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Voice profile not found');
    return this.toVoiceRecord(item);
  }

  async update(id: string, dto: UpdateVoiceProfileDto) {
    if (this.prisma.isMockMode) return this.updateMock(id, dto);
    await this.get(id);
    const previewAudioUrl = dto.previewAudioUrl ?? dto.previewUrl;
    const data: any = {
      ...(dto.provider ? { provider: dto.provider } : {}),
      ...(dto.displayName ? { displayName: dto.displayName } : {}),
      ...(dto.voiceId ? { voiceId: dto.voiceId } : {}),
      ...(dto.modelId !== undefined ? { modelId: dto.modelId } : {}),
      ...(dto.outputFormat !== undefined ? { outputFormat: dto.outputFormat } : {}),
      ...(dto.language !== undefined ? { language: dto.language } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(previewAudioUrl !== undefined ? { previewAudioUrl } : {}),
      ...(dto.defaultSpeed !== undefined ? { defaultSpeed: dto.defaultSpeed } : {}),
      ...(dto.defaultStability !== undefined ? { defaultStability: dto.defaultStability } : {}),
      ...(dto.defaultSimilarityBoost !== undefined ? { defaultSimilarityBoost: dto.defaultSimilarityBoost } : {}),
      ...(dto.status ? { status: this.normalizeStatus(dto.status, 'PUBLISHED') } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: Boolean(dto.isDefault) } : {}),
    };
    const saved = await this.prisma.db.$transaction(async (tx: any) => {
      if (dto.isDefault) await tx.voiceProfile.updateMany({ data: { isDefault: false } });
      return tx.voiceProfile.update({ where: { id }, data });
    }).catch((error: any) => {
      if (String(error?.code) === 'P2002') throw new ConflictException('Voice provider and voiceId already exist');
      throw error;
    });
    return this.toVoiceRecord(saved);
  }

  async test(id: string, dto: TestVoiceProfileDto) {
    const item = await this.get(id);
    const audioUrl = item.previewAudioUrl ?? item.previewUrl ?? mockSilentPreviewAudio;
    return {
      success: true,
      id,
      provider: item.provider,
      voiceId: item.voiceId,
      text: dto.text ?? '你好，我是 Jarvis。',
      audioUrl,
      previewAudioUrl: audioUrl,
      mimeType: this.guessMimeType(audioUrl),
      ttlSeconds: 600,
    };
  }

  async setDefault(id: string) {
    if (this.prisma.isMockMode) return this.setDefaultMock(id);
    await this.get(id);
    const saved = await this.prisma.db.$transaction(async (tx: any) => {
      await tx.voiceProfile.updateMany({ data: { isDefault: false } });
      return tx.voiceProfile.update({ where: { id }, data: { isDefault: true, status: 'PUBLISHED' } });
    });
    return this.toVoiceRecord(saved);
  }

  async publish(id: string) {
    if (this.prisma.isMockMode) return this.publishMock(id);
    const item = await this.prisma.db.voiceProfile.update({ where: { id }, data: { status: 'PUBLISHED' } }).catch(() => null);
    if (!item) throw new NotFoundException('Voice profile not found');
    return this.toVoiceRecord(item);
  }

  async disable(id: string) {
    if (this.prisma.isMockMode) return this.disableMock(id);
    const item = await this.prisma.db.voiceProfile.update({ where: { id }, data: { status: 'DISABLED', isDefault: false } }).catch(() => null);
    if (!item) throw new NotFoundException('Voice profile not found');
    return this.toVoiceRecord(item);
  }

  async previewAudioUploadReserved(id: string) {
    await this.get(id);
    return {
      id,
      status: 'READY',
      message: 'Use POST /studio/media/upload with kind=voice-preview, then save the returned url as previewAudioUrl.',
    };
  }

  async delete(id: string) {
    if (this.prisma.isMockMode) return this.deleteMock(id);
    await this.prisma.db.voiceProfile.delete({ where: { id } }).catch(() => { throw new NotFoundException('Voice profile not found'); });
    return { deleted: true, id };
  }

  private async ensureDefaultVoiceProfile() {
    const count = await this.prisma.db.voiceProfile.count();
    if (count > 0) return;
    await this.prisma.db.voiceProfile.create({
      data: {
        id: DEFAULT_VOICE_PROFILE_ID,
        provider: 'MOCK',
        displayName: 'Jarvis Default Voice',
        voiceId: 'mock_voice_jarvis',
        modelId: 'mock-tts',
        outputFormat: 'mp3_44100_128',
        language: 'zh-CN',
        description: 'Default sample voice profile. Replace the preview audio from Studio when real media is ready.',
        previewAudioUrl: mockSilentPreviewAudio,
        defaultSpeed: 1,
        defaultStability: 0.5,
        defaultSimilarityBoost: 0.75,
        status: 'PUBLISHED',
        isDefault: true,
      },
    });
  }

  private toVoiceRecord(item: any) {
    const previewAudioUrl = item.previewAudioUrl ?? item.preview_audio_url ?? '';
    return {
      id: item.id,
      provider: item.provider,
      displayName: item.displayName,
      name: item.displayName,
      voiceId: item.voiceId,
      modelId: item.modelId ?? '',
      outputFormat: item.outputFormat ?? 'mp3_44100_128',
      language: item.language ?? 'zh-CN',
      description: item.description ?? '',
      previewAudioUrl,
      previewUrl: previewAudioUrl,
      status: item.status,
      isDefault: Boolean(item.isDefault),
      apiKeyConfigured: item.provider === 'MOCK' || item.provider === 'CUSTOM' || item.provider === 'LOCAL',
      defaultSpeed: this.toNumber(item.defaultSpeed, 1),
      defaultStability: this.toNumber(item.defaultStability, 0.5),
      defaultSimilarityBoost: this.toNumber(item.defaultSimilarityBoost, 0.75),
      createdAt: this.toIso(item.createdAt),
      updatedAt: this.toIso(item.updatedAt),
    };
  }

  private normalizeStatus(value: any, fallback: ResourceStatus): ResourceStatus {
    const status = String(value ?? fallback).toUpperCase();
    if (['ACTIVE', 'PUBLISHED', 'DISABLED', 'ARCHIVED'].includes(status)) return status as ResourceStatus;
    return fallback;
  }

  private toNumber(value: any, fallback: number) {
    if (value === null || value === undefined) return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  private toIso(value: any) {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }

  private guessMimeType(url: string) {
    const value = url.toLowerCase();
    if (value.endsWith('.mp3')) return 'audio/mpeg';
    if (value.endsWith('.m4a')) return 'audio/mp4';
    if (value.endsWith('.wav')) return 'audio/wav';
    return 'audio/wav';
  }

  private listMock(query?: { status?: string }) {
    if (!query?.status || query.status === 'ALL') return mockVoiceProfiles;
    const wanted = query.status.toUpperCase();
    return mockVoiceProfiles.filter((profile) => String(profile.status).toUpperCase() === wanted);
  }

  private createMock(dto: CreateVoiceProfileDto & { status?: ResourceStatus }) {
    const now = new Date().toISOString();
    const previewAudioUrl = dto.previewAudioUrl ?? dto.previewUrl ?? mockSilentPreviewAudio;
    const item = {
      id: `voice_profile_${Date.now()}`,
      provider: dto.provider,
      displayName: dto.displayName,
      name: dto.displayName,
      voiceId: dto.voiceId,
      modelId: dto.modelId ?? (dto.provider === 'MOCK' ? 'mock-tts' : 'eleven_v3'),
      outputFormat: dto.outputFormat ?? 'mp3_44100_128',
      language: dto.language ?? 'zh-CN',
      description: dto.description ?? '',
      previewAudioUrl,
      previewUrl: previewAudioUrl,
      status: this.normalizeStatus((dto as any).status, 'PUBLISHED'),
      isDefault: Boolean(dto.isDefault),
      apiKeyConfigured: dto.provider === 'MOCK' || dto.provider === 'CUSTOM' || dto.provider === 'LOCAL',
      defaultSpeed: dto.defaultSpeed ?? 1,
      defaultStability: dto.defaultStability ?? 0.5,
      defaultSimilarityBoost: dto.defaultSimilarityBoost ?? 0.75,
      createdAt: now,
      updatedAt: now,
    };
    if (item.isDefault) mockVoiceProfiles.forEach((profile) => (profile.isDefault = false));
    mockVoiceProfiles.push(item as any);
    return item;
  }

  private getMock(id: string) {
    const item = mockVoiceProfiles.find((profile) => profile.id === id);
    if (!item) throw new NotFoundException('Voice profile not found');
    return item;
  }

  private updateMock(id: string, dto: UpdateVoiceProfileDto) {
    const item = this.getMock(id) as any;
    const previewAudioUrl = dto.previewAudioUrl ?? dto.previewUrl;
    Object.assign(item, {
      ...dto,
      ...(previewAudioUrl !== undefined ? { previewAudioUrl, previewUrl: previewAudioUrl } : {}),
      updatedAt: new Date().toISOString(),
    });
    if (dto.displayName) item.name = dto.displayName;
    if (dto.isDefault) mockVoiceProfiles.forEach((profile) => { profile.isDefault = profile.id === id; });
    return item;
  }

  private setDefaultMock(id: string) {
    this.getMock(id);
    mockVoiceProfiles.forEach((profile) => { profile.isDefault = profile.id === id; });
    return this.getMock(id);
  }

  private publishMock(id: string) {
    const item = this.getMock(id) as any;
    item.status = 'PUBLISHED';
    item.updatedAt = new Date().toISOString();
    return item;
  }

  private disableMock(id: string) {
    const item = this.getMock(id) as any;
    item.status = 'DISABLED';
    item.isDefault = false;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  private deleteMock(id: string) {
    const index = mockVoiceProfiles.findIndex((profile) => profile.id === id);
    if (index === -1) throw new NotFoundException('Voice profile not found');
    mockVoiceProfiles.splice(index, 1);
    return { deleted: true, id };
  }
}
