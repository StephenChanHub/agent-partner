import { useEffect, useMemo, useState } from 'react';
import { homeAgents } from './config/agents';
import { ChatPage } from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import { WalletPage } from './pages/WalletPage';
import { ProfilePage } from './pages/ProfilePage';

function getCurrentPath() {
  return window.location.pathname || '/';
}

export default function App() {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    const syncPath = () => setPath(getCurrentPath());
    window.addEventListener('popstate', syncPath);
    window.addEventListener('agent-user-web:navigate', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('agent-user-web:navigate', syncPath);
    };
  }, []);

  const chatAgent = useMemo(() => {
    const match = path.match(/^\/chat\/([^/]+)$/);
    if (!match) return null;
    return homeAgents.find((agent) => agent.id === decodeURIComponent(match[1])) ?? homeAgents[0];
  }, [path]);

  if (path === '/wallet') {
    return <WalletPage />;
  }

  if (path === '/profile') {
    return <ProfilePage />;
  }

  if (chatAgent) {
    return <ChatPage agent={chatAgent} />;
  }

  return <HomePage />;
}
