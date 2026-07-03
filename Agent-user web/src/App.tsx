import { useEffect, useMemo, useState } from 'react';
import { fallbackHomeAgents, fetchHomeAgents, type HomeAgent } from './config/agents';
import { ChatPage } from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import { WalletPage } from './pages/WalletPage';
import { ProfilePage } from './pages/ProfilePage';

function getCurrentPath() {
  return window.location.pathname || '/';
}

export default function App() {
  const [path, setPath] = useState(getCurrentPath);
  const [agents, setAgents] = useState<HomeAgent[]>(fallbackHomeAgents);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string>();

  useEffect(() => {
    const syncPath = () => setPath(getCurrentPath());
    window.addEventListener('popstate', syncPath);
    window.addEventListener('agent-user-web:navigate', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('agent-user-web:navigate', syncPath);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAgentsLoading(true);
    fetchHomeAgents()
      .then((items) => {
        if (cancelled) return;
        setAgents(items.length ? items : fallbackHomeAgents);
        setAgentsError(undefined);
      })
      .catch((error) => {
        if (cancelled) return;
        setAgents(fallbackHomeAgents);
        setAgentsError(error instanceof Error ? error.message : 'Agent list unavailable');
      })
      .finally(() => {
        if (!cancelled) setAgentsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const chatAgent = useMemo(() => {
    const match = path.match(/^\/chat\/([^/]+)$/);
    if (!match) return null;
    const key = decodeURIComponent(match[1]);
    return agents.find((agent) => agent.id === key || agent.slug === key) ?? agents[0] ?? fallbackHomeAgents[0];
  }, [agents, path]);

  if (path === '/wallet') return <WalletPage />;
  if (path === '/profile') return <ProfilePage />;
  if (chatAgent) return <ChatPage agent={chatAgent} />;
  return <HomePage agents={agents} loadingAgents={agentsLoading} agentsError={agentsError} />;
}
