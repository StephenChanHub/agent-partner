import { Injectable, NotFoundException } from '@nestjs/common';
import { mockSilentPreviewAudio, mockVoiceProfiles } from '../../mock/mock-data';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from './dto/update-voice-profile.dto';
import { TestVoiceProfileDto } from './dto/test-voice-profile.dto';

@Injectable()
export class VoiceProfilesService {
  list(query?: { status?: string }) {
    if (!query?.status) return mockVoiceProfiles;
    const wanted = query.status.toUpperCase();
    return mockVoiceProfiles.filter((profile) => String(profile.status).toUpperCase() === wanted);
  }

  create(dto: CreateVoiceProfileDto) {
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
      status: 'PUBLISHED' as const,
      isDefault: Boolean(dto.isDefault),
      apiKeyConfigured: dto.provider === 'MOCK' || dto.provider === 'CUSTOM',
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

  get(id: string) {
    const item = mockVoiceProfiles.find((profile) => profile.id === id);
    if (!item) throw new NotFoundException('Voice profile not found');
    return item;
  }

  update(id: string, dto: UpdateVoiceProfileDto) {
    const item = this.get(id) as any;
    const previewAudioUrl = dto.previewAudioUrl ?? dto.previewUrl;
    Object.assign(item, {
      ...dto,
      ...(previewAudioUrl ? { previewAudioUrl, previewUrl: previewAudioUrl } : {}),
      updatedAt: new Date().toISOString(),
    });
    if (dto.displayName) item.name = dto.displayName;
    if (dto.isDefault) mockVoiceProfiles.forEach((profile) => { profile.isDefault = profile.id === id; });
    return item;
  }

  test(id: string, dto: TestVoiceProfileDto) {
    const item = this.get(id);
    return {
      success: true,
      id,
      provider: item.provider,
      voiceId: item.voiceId,
      text: dto.text ?? '你好，我是 Jarvis。',
      audioUrl: item.previewAudioUrl ?? item.previewUrl ?? mockSilentPreviewAudio,
      previewAudioUrl: item.previewAudioUrl ?? item.previewUrl ?? mockSilentPreviewAudio,
      mimeType: 'audio/wav',
      ttlSeconds: 600,
    };
  }

  setDefault(id: string) {
    this.get(id);
    mockVoiceProfiles.forEach((profile) => { profile.isDefault = profile.id === id; });
    return this.get(id);
  }

  publish(id: string) {
    const item = this.get(id) as any;
    item.status = 'PUBLISHED';
    item.updatedAt = new Date().toISOString();
    return item;
  }

  disable(id: string) {
    const item = this.get(id) as any;
    item.status = 'DISABLED';
    item.updatedAt = new Date().toISOString();
    return item;
  }

  previewAudioUploadReserved(id: string) {
    this.get(id);
    return {
      id,
      status: 'RESERVED',
      message: 'Preview audio upload is reserved. v1.7.2 frontend only uses local browser preview and does not upload files.',
    };
  }
}
