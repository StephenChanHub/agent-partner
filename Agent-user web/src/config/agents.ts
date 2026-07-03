import { apiGet } from '../utils/apiClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://192.168.64.2:3000/api';

export type HomeAgentMedia = {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  posterUrl?: string;
};

export type HomeAgent = {
  id: string;
  slug: string;
  name: string;
  description: string;
  avatarUrl?: string;
  voiceProfileId?: string;
  voiceDisplayName?: string;
  voicePreviewAudioUrl?: string;
  mediaItems: HomeAgentMedia[];
};

type AgentRecord = {
  id: string;
  slug: string;
  status: string;
  manifest?: {
    identity?: { name?: string; slug?: string; description?: string; avatarUrl?: string };
    social?: {
      galleryImages?: Array<{ url: string; alt?: string; sortOrder?: number }>;
      galleryVideos?: Array<{ url: string; posterUrl?: string; title?: string; sortOrder?: number }>;
    };
    voice?: { profileId?: string; displayName?: string; previewAudioUrl?: string };
  };
};

function resolveMediaUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

export const fallbackHomeAgents: HomeAgent[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    slug: 'jarvis',
    name: 'Jarvis',
    description: 'Your personal AI companion.',
    voiceProfileId: '00000000-0000-4000-8000-000000000101',
    voiceDisplayName: 'Jarvis Default Voice',
    voicePreviewAudioUrl: '',
    mediaItems: [],
  },
];

// Legacy name retained so older imports keep compiling, but the Home page now calls fetchHomeAgents().
export const homeAgents = fallbackHomeAgents;

export function mapAgentRecord(record: AgentRecord): HomeAgent {
  const identity = record.manifest?.identity ?? {};
  const social = record.manifest?.social ?? {};
  const images = (social.galleryImages ?? [])
    .slice()
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((item, index) => ({
      id: `${record.id}_image_${index}`,
      type: 'image' as const,
      url: resolveMediaUrl(item.url),
      name: item.alt || `${identity.name || record.slug} image ${index + 1}`,
    }));
  const videos = (social.galleryVideos ?? [])
    .slice()
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((item, index) => ({
      id: `${record.id}_video_${index}`,
      type: 'video' as const,
      url: resolveMediaUrl(item.url),
      posterUrl: resolveMediaUrl(item.posterUrl),
      name: item.title || `${identity.name || record.slug} video ${index + 1}`,
    }));

  return {
    id: record.id,
    slug: record.slug,
    name: identity.name || record.slug,
    description: identity.description || 'Agent profile.',
    avatarUrl: resolveMediaUrl(identity.avatarUrl),
    voiceProfileId: record.manifest?.voice?.profileId,
    voiceDisplayName: record.manifest?.voice?.displayName,
    voicePreviewAudioUrl: resolveMediaUrl(record.manifest?.voice?.previewAudioUrl),
    mediaItems: [...images, ...videos],
  };
}

export async function fetchHomeAgents(): Promise<HomeAgent[]> {
  const records = await apiGet<AgentRecord[]>('/agents');
  const mapped = (records ?? []).map(mapAgentRecord).filter((agent) => agent.name);
  return mapped.length ? mapped : fallbackHomeAgents;
}
