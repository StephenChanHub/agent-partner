import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 15_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#007aff',
          colorInfo: '#007aff',
          colorSuccess: '#34c759',
          colorWarning: '#ff9500',
          colorError: '#ff3b30',
          borderRadius: 16,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
        },
        components: {
          Layout: {
            headerBg: 'rgba(255,255,255,0.78)',
            siderBg: 'rgba(255,255,255,0.76)',
          },
          Card: {
            borderRadiusLG: 24,
          },
          Button: {
            borderRadius: 999,
            controlHeight: 40,
          },
          Input: {
            borderRadius: 14,
          },
          Select: {
            borderRadius: 14,
          },
          Modal: {
            borderRadiusLG: 24,
          },
        },
      }}
    >
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary><App /></ErrorBoundary>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
