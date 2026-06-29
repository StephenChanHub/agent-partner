import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Jarvis Studio ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="页面渲染失败"
          subTitle={this.state.message || '请刷新页面；如果仍然失败，检查 Core 沙盒与浏览器控制台。'}
          extra={<Button type="primary" onClick={() => window.location.reload()}>刷新页面</Button>}
        />
      );
    }
    return this.props.children;
  }
}
