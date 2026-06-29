import { Navigate, Route, Routes } from 'react-router-dom';
import { StudioLayout } from '../layout/StudioLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/users/UsersPage';
import { UserDetailPage } from '../pages/users/UserDetailPage';
import { AgentsPage } from '../pages/agents/AgentsPage';
import { AgentEditPage } from '../pages/agents/AgentEditPage';
import { ModelProfilesPage } from '../pages/model-profiles/ModelProfilesPage';
import { VoiceProfilesPage } from '../pages/voice-profiles/VoiceProfilesPage';
import { VoiceEditPage } from '../pages/voice-profiles/VoiceEditPage';
import { RechargeOrdersPage } from '../pages/billing/RechargeOrdersPage';
import { TokenTransactionsPage } from '../pages/billing/TokenTransactionsPage';
import { UsageRecordsPage } from '../pages/billing/UsageRecordsPage';
import { PricingPage } from '../pages/billing/PricingPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <StudioLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="agents/new" element={<AgentEditPage mode="create" />} />
        <Route path="agents/:id/edit" element={<AgentEditPage mode="edit" />} />
        <Route path="model-profiles" element={<ModelProfilesPage />} />
        <Route path="voice-profiles" element={<VoiceProfilesPage />} />
        <Route path="voice-profiles/new" element={<VoiceEditPage mode="create" />} />
        <Route path="voice-profiles/:id/edit" element={<VoiceEditPage mode="edit" />} />
        <Route path="billing/recharge-orders" element={<RechargeOrdersPage />} />
        <Route path="billing/token-transactions" element={<TokenTransactionsPage />} />
        <Route path="billing/usage-records" element={<UsageRecordsPage />} />
        <Route path="billing/pricing" element={<PricingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
