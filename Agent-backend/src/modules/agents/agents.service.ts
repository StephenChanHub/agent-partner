import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { mockAgents, mockVoiceProfiles } from '../../mock/mock-data';

type AgentStatusValue = 'DRAFT' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED';

type AgentManifest = {
  identity: { name: string; slug?: string; description?: string; avatarUrl?: string };
  social?: {
    galleryImages?: Array<{ url: string; alt?: string; sortOrder?: number }>;
    galleryVideos?: Array<{ url: string; posterUrl?: string; title?: string; sortOrder?: number }>;
  };
  model?: { profileId?: string };
  voice?: { profileId?: string; displayName?: string; previewAudioUrl?: string };
  config?: { prompt?: string };
};

const DEFAULT_AGENT_ID = '00000000-0000-4000-8000-000000000201';
const DEFAULT_AGENT_SLUG = 'jarvis';
const DEFAULT_MODEL_PROFILE_ID = 'model_profile_deepseek_default';
const DEFAULT_VOICE_PROFILE_ID = '00000000-0000-4000-8000-000000000101';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished() {
    if (this.prisma.isMockMode) return mockAgents.filter((agent) => agent.status === 'PUBLISHED');
    await this.ensureDefaultAgent();
    const agents = await this.prisma.db.agent.findMany({
      where: { status: 'PUBLISHED' },
      include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
    return agents.map((agent: any) => this.toAgentRecord(agent));
  }

  async listAll(query: any = {}) {
    if (this.prisma.isMockMode) return this.listAllMock(query);
    await this.ensureDefaultAgent();
    const wantedStatus = query.status && query.status !== 'ALL' ? String(query.status).toUpperCase() : undefined;
    const agents = await this.prisma.db.agent.findMany({
      where: wantedStatus ? { status: wantedStatus } : undefined,
      include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
    const keyword = String(query.keyword ?? '').toLowerCase().trim();
    return agents
      .map((agent: any) => this.toAgentRecord(agent))
      .filter((agent: any) => {
        if (!keyword) return true;
        const name = agent.manifest?.identity?.name?.toLowerCase?.() ?? '';
        const description = agent.manifest?.identity?.description?.toLowerCase?.() ?? '';
        return agent.slug.includes(keyword) || name.includes(keyword) || description.includes(keyword);
      });
  }

  async getBySlug(slug: string) {
    if (this.prisma.isMockMode) {
      const agent = mockAgents.find((item) => item.slug === slug && item.status === 'PUBLISHED');
      if (!agent) throw new NotFoundException('Agent not found');
      return agent;
    }
    await this.ensureDefaultAgent();
    const agent = await this.prisma.db.agent.findUnique({
      where: { slug },
      include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
    });
    if (!agent || agent.status !== 'PUBLISHED') throw new NotFoundException('Agent not found');
    return this.toAgentRecord(agent);
  }

  async get(id: string) {
    if (this.prisma.isMockMode) {
      const agent = mockAgents.find((item) => item.id === id);
      if (!agent) throw new NotFoundException('Agent not found');
      return agent;
    }
    const agent = await this.prisma.db.agent.findUnique({
      where: { id },
      include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return this.toAgentRecord(agent);
  }

  async create(dto: any) {
    if (this.prisma.isMockMode) return this.createMock(dto);
    const slug = this.normalizeSlug(dto.slug ?? dto.manifest?.identity?.slug ?? dto.name ?? dto.displayName);
    const exists = await this.prisma.db.agent.findUnique({ where: { slug } });
    if (exists) throw new ConflictException('Agent slug already exists');
    const manifest = this.normalizeManifest({ ...dto, slug });
    const status = this.normalizeStatus(dto.status, 'DRAFT');
    const versionStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    const manifestHash = this.hashManifest(manifest);
    const saved = await this.prisma.db.$transaction(async (tx: any) => {
      const agent = await tx.agent.create({ data: { id: dto.id, slug, status } });
      const version = await tx.agentVersion.create({
        data: {
          agentId: agent.id,
          version: dto.version ?? '0.1.0',
          status: versionStatus,
          manifest,
          manifestHash,
          changelog: dto.changelog ?? 'Initial agent profile.',
        },
      });
      if (status === 'PUBLISHED') {
        return tx.agent.update({
          where: { id: agent.id },
          data: { publishedVersionId: version.id, status: 'PUBLISHED' },
          include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
        });
      }
      return tx.agent.findUnique({
        where: { id: agent.id },
        include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
      });
    });
    return this.toAgentRecord(saved);
  }

  async update(id: string, dto: any) {
    if (this.prisma.isMockMode) return this.updateMock(id, dto);
    const current = await this.prisma.db.agent.findUnique({
      where: { id },
      include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
    });
    if (!current) throw new NotFoundException('Agent not found');
    const currentRecord = this.toAgentRecord(current);
    const nextSlug = dto.slug ? this.normalizeSlug(dto.slug) : current.slug;
    const nextManifest = this.normalizeManifest({
      ...dto,
      slug: nextSlug,
      manifest: dto.manifest ?? currentRecord.manifest,
    });
    const nextStatus = dto.status ? this.normalizeStatus(dto.status, current.status) : current.status;
    const latestVersion = current.versions?.[0];
    const manifestHash = this.hashManifest(nextManifest);

    const saved = await this.prisma.db.$transaction(async (tx: any) => {
      await tx.agent.update({ where: { id }, data: { slug: nextSlug, status: nextStatus } });
      if (latestVersion && latestVersion.status === 'DRAFT') {
        await tx.agentVersion.update({
          where: { id: latestVersion.id },
          data: { manifest: nextManifest, manifestHash, changelog: dto.changelog ?? latestVersion.changelog },
        });
      } else {
        await tx.agentVersion.create({
          data: {
            agentId: id,
            version: this.nextDraftVersion(latestVersion?.version ?? currentRecord.version),
            status: 'DRAFT',
            manifest: nextManifest,
            manifestHash: `${manifestHash}-${Date.now().toString(36)}`,
            changelog: dto.changelog ?? 'Updated from Studio.',
          },
        });
      }
      return tx.agent.findUnique({
        where: { id },
        include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
      });
    });
    return this.toAgentRecord(saved);
  }

  async publish(id: string) {
    if (this.prisma.isMockMode) return this.publishMock(id);
    const current = await this.prisma.db.agent.findUnique({ where: { id }, include: { versions: { orderBy: { updatedAt: 'desc' }, take: 1 } } });
    if (!current) throw new NotFoundException('Agent not found');
    const latest = current.versions?.[0];
    if (!latest) throw new BadRequestException('Agent has no version to publish');
    const saved = await this.prisma.db.$transaction(async (tx: any) => {
      await tx.agentVersion.update({ where: { id: latest.id }, data: { status: 'PUBLISHED' } });
      return tx.agent.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedVersionId: latest.id },
        include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
      });
    });
    return this.toAgentRecord(saved);
  }

  async disable(id: string) {
    if (this.prisma.isMockMode) return this.disableMock(id);
    const agent = await this.prisma.db.agent.update({
      where: { id },
      data: { status: 'DISABLED' },
      include: { publishedVersion: true, versions: { orderBy: { updatedAt: 'desc' }, take: 1 } },
    }).catch(() => null);
    if (!agent) throw new NotFoundException('Agent not found');
    return this.toAgentRecord(agent);
  }

  async delete(id: string) {
    if (this.prisma.isMockMode) return this.deleteMock(id);
    await this.prisma.db.agent.delete({ where: { id } }).catch(() => { throw new NotFoundException('Agent not found'); });
    return { deleted: true, id };
  }

  private async ensureDefaultAgent() {
    const count = await this.prisma.db.agent.count();
    if (count > 0) return;
    const voice = await this.findDefaultVoiceProfile();
    const manifest = this.sampleManifest(voice?.id ?? DEFAULT_VOICE_PROFILE_ID, voice?.displayName ?? 'Jarvis Default Voice', voice?.previewAudioUrl);
    await this.prisma.db.$transaction(async (tx: any) => {
      const agent = await tx.agent.create({ data: { id: DEFAULT_AGENT_ID, slug: DEFAULT_AGENT_SLUG, status: 'PUBLISHED' } });
      const version = await tx.agentVersion.create({
        data: {
          agentId: agent.id,
          version: '1.0.0',
          status: 'PUBLISHED',
          manifest,
          manifestHash: this.hashManifest(manifest),
          changelog: 'Default sample agent retained for first-run setup.',
        },
      });
      await tx.agent.update({ where: { id: agent.id }, data: { publishedVersionId: version.id } });
    });
  }

  private async findDefaultVoiceProfile() {
    if (this.prisma.isMockMode) return mockVoiceProfiles[0];
    const existing = await this.prisma.db.voiceProfile.findFirst({
      where: { status: { in: ['PUBLISHED', 'ACTIVE'] } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }).catch(() => null);
    if (existing) return existing;
    return this.prisma.db.voiceProfile.create({
      data: {
        id: DEFAULT_VOICE_PROFILE_ID,
        provider: 'ELEVENLABS',
        displayName: 'Jarvis Default Voice',
        voiceId: 'JBFqnCBsd6RMkjVDRZzb',
        modelId: 'eleven_v3',
        outputFormat: 'mp3_44100_128',
        language: null,
        description: 'Default ElevenLabs voice profile. Configure the platform API key and generate a preview sample.',
        previewAudioUrl: '',
        defaultSpeed: 1,
        defaultStability: 0.5,
        defaultSimilarityBoost: 0.75,
        status: 'PUBLISHED',
        isDefault: true,
      },
    }).catch(() => null);
  }

  private toAgentRecord(agent: any) {
    const version = agent.publishedVersion ?? agent.versions?.[0];
    const manifest = (version?.manifest ?? this.sampleManifest()) as AgentManifest;
    return {
      id: agent.id,
      slug: agent.slug,
      status: agent.status,
      version: version?.version ?? '0.1.0',
      createdAt: this.toIso(agent.createdAt),
      updatedAt: this.toIso(agent.updatedAt ?? version?.updatedAt),
      manifest,
    };
  }

  private normalizeManifest(dto: any): AgentManifest {
    const input = dto.manifest ?? {};
    const identity = input.identity ?? {};
    const slug = this.normalizeSlug(dto.slug ?? identity.slug ?? dto.name ?? dto.displayName ?? DEFAULT_AGENT_SLUG);
    return {
      identity: {
        name: String(identity.name ?? dto.name ?? dto.displayName ?? 'New Agent'),
        slug,
        description: String(identity.description ?? dto.description ?? ''),
        avatarUrl: String(identity.avatarUrl ?? dto.avatarUrl ?? ''),
      },
      social: {
        galleryImages: Array.isArray(input.social?.galleryImages) ? input.social.galleryImages : [],
        galleryVideos: Array.isArray(input.social?.galleryVideos) ? input.social.galleryVideos : [],
      },
      model: { profileId: input.model?.profileId ?? dto.modelProfileId ?? DEFAULT_MODEL_PROFILE_ID },
      voice: {
        profileId: input.voice?.profileId ?? dto.voiceProfileId ?? DEFAULT_VOICE_PROFILE_ID,
        displayName: input.voice?.displayName ?? dto.voiceDisplayName ?? '',
        previewAudioUrl: input.voice?.previewAudioUrl ?? dto.voicePreviewAudioUrl ?? '',
      },
      config: { prompt: input.config?.prompt ?? dto.configPrompt ?? '你是一个 Jarvis Agent。' },
    };
  }

  private sampleManifest(voiceProfileId = DEFAULT_VOICE_PROFILE_ID, voiceDisplayName = 'Jarvis Default Voice', previewAudioUrl = ''): AgentManifest {
    return {
      identity: {
        name: 'Jarvis',
        slug: DEFAULT_AGENT_SLUG,
        description: 'Your personal AI companion.',
        avatarUrl: '',
      },
      social: { galleryImages: [], galleryVideos: [] },
      model: { profileId: DEFAULT_MODEL_PROFILE_ID },
      voice: { profileId: voiceProfileId, displayName: voiceDisplayName, previewAudioUrl },
      config: { prompt: '你是 Jarvis，一个冷静、直接、可靠的私人 AI 助手。回答时先给结论，再给步骤。' },
    };
  }

  private normalizeSlug(value: any) {
    const slug = String(value ?? DEFAULT_AGENT_SLUG).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) throw new BadRequestException('Agent slug is required');
    return slug;
  }

  private normalizeStatus(value: any, fallback: any): AgentStatusValue {
    const status = String(value ?? fallback ?? 'DRAFT').toUpperCase();
    if (['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'].includes(status)) return status as AgentStatusValue;
    return fallback as AgentStatusValue;
  }

  private hashManifest(manifest: AgentManifest) {
    return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  }

  private nextDraftVersion(version: string) {
    const parts = String(version || '0.1.0').split('.').map((item) => Number(item));
    const major = Number.isFinite(parts[0]) ? parts[0] : 0;
    const minor = Number.isFinite(parts[1]) ? parts[1] : 1;
    const patch = Number.isFinite(parts[2]) ? parts[2] + 1 : 1;
    return `${major}.${minor}.${patch}`;
  }

  private toIso(value: any) {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }

  private listAllMock(query: any = {}) {
    const keyword = (query.keyword ?? '').toString().toLowerCase();
    const wantedStatus = query.status && query.status !== 'ALL' ? String(query.status).toUpperCase() : undefined;
    return mockAgents.filter((agent) => {
      const name = agent.manifest?.identity?.name?.toLowerCase?.() ?? '';
      const matchedKeyword = !keyword || agent.slug.includes(keyword) || name.includes(keyword);
      const matchedStatus = !wantedStatus || String(agent.status).toUpperCase() === wantedStatus;
      return matchedKeyword && matchedStatus;
    });
  }

  private createMock(dto: any) {
    const now = new Date().toISOString();
    const slug = this.normalizeSlug(dto.slug ?? dto.manifest?.identity?.slug ?? `agent-${Date.now()}`);
    const agent = {
      id: `agent_${Date.now()}`,
      slug,
      status: this.normalizeStatus(dto.status, 'DRAFT'),
      version: '0.1.0',
      createdAt: now,
      updatedAt: now,
      manifest: this.normalizeManifest({ ...dto, slug }),
    };
    mockAgents.push(agent as any);
    return agent;
  }

  private updateMock(id: string, dto: any) {
    const agent = mockAgents.find((item) => item.id === id) as any;
    if (!agent) throw new NotFoundException('Agent not found');
    const slug = dto.slug ? this.normalizeSlug(dto.slug) : agent.slug;
    Object.assign(agent, dto, { slug, updatedAt: new Date().toISOString() });
    agent.manifest = this.normalizeManifest({ ...dto, slug, manifest: dto.manifest ?? agent.manifest });
    return agent;
  }

  private publishMock(id: string) {
    const agent = mockAgents.find((item) => item.id === id) as any;
    if (!agent) throw new NotFoundException('Agent not found');
    agent.status = 'PUBLISHED';
    agent.updatedAt = new Date().toISOString();
    return agent;
  }

  private disableMock(id: string) {
    const agent = mockAgents.find((item) => item.id === id) as any;
    if (!agent) throw new NotFoundException('Agent not found');
    agent.status = 'DISABLED';
    agent.updatedAt = new Date().toISOString();
    return agent;
  }

  private deleteMock(id: string) {
    const index = mockAgents.findIndex((item) => item.id === id);
    if (index === -1) throw new NotFoundException('Agent not found');
    mockAgents.splice(index, 1);
    return { deleted: true, id };
  }
}
