export type HomeAgent = {
  id: string;
  name: string;
  description: string;
};

export const homeAgents: HomeAgent[] = [
  {
    id: 'agent_nexus',
    name: 'Nexus',
    description: 'A calm AI partner for daily planning, creative thinking, and focused conversation.',
  },
  {
    id: 'agent_luna',
    name: 'Luna',
    description: 'A warm companion for emotional support, gentle reflection, and relaxed chat.',
  },
  {
    id: 'agent_aria',
    name: 'Aria',
    description: 'A clear and structured assistant for learning, writing, and problem solving.',
  },
];
