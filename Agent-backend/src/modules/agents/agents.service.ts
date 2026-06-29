import { Injectable, NotFoundException } from '@nestjs/common';
import { mockAgents } from '../../mock/mock-data';

@Injectable()
export class AgentsService {
  listPublished() {
    return mockAgents.filter((agent) => agent.status === 'PUBLISHED');
  }

  listAll(query: any = {}) {
    const keyword = (query.keyword ?? '').toString().toLowerCase();
    return mockAgents.filter((agent) => {
      const name = agent.manifest?.identity?.name?.toLowerCase?.() ?? '';
      return !keyword || agent.slug.includes(keyword) || name.includes(keyword);
    });
  }

  getBySlug(slug: string) {
    const agent = mockAgents.find((item) => item.slug === slug);
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  get(id: string) {
    const agent = mockAgents.find((item) => item.id === id);
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  create(dto: any) {
    const now = new Date().toISOString();
    const slug = dto.slug ?? dto.manifest?.identity?.slug ?? `agent-${Date.now()}`;
    const agent = {
      id: `agent_${Date.now()}`,
      slug,
      status: dto.status ?? 'DRAFT',
      version: '0.1.0',
      createdAt: now,
      updatedAt: now,
      manifest: dto.manifest ?? {
        identity: {
          name: dto.name ?? dto.displayName ?? 'New Agent',
          slug,
          description: dto.description ?? '',
          avatarUrl: dto.avatarUrl ?? '',
        },
        social: { galleryImages: [], galleryVideos: [] },
        model: { profileId: dto.modelProfileId ?? 'model_profile_mock_default' },
        voice: { profileId: dto.voiceProfileId ?? 'voice_profile_mock_default' },
        config: { prompt: dto.configPrompt ?? '你是一个 Jarvis Agent。' },
      },
    };
    mockAgents.push(agent as any);
    return agent;
  }

  update(id: string, dto: any) {
    const agent = this.get(id) as any;
    Object.assign(agent, dto, { updatedAt: new Date().toISOString() });
    if (dto.manifest) agent.manifest = dto.manifest;
    return agent;
  }

  publish(id: string) {
    const agent = this.get(id) as any;
    agent.status = 'PUBLISHED';
    agent.updatedAt = new Date().toISOString();
    return agent;
  }

  disable(id: string) {
    const agent = this.get(id) as any;
    agent.status = 'DISABLED';
    agent.updatedAt = new Date().toISOString();
    return agent;
  }
}
