import { Injectable } from '@nestjs/common';
import { mockAgents, mockRechargeOrders, mockTokenTransactions, mockUsageRecords, mockUsers } from '../../mock/mock-data';

@Injectable()
export class StudioService {
  dashboard() {
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const todayRechargeRmb = mockRechargeOrders
      .filter((order) => order.status === 'PAID' && order.paidAt?.startsWith(todayPrefix))
      .reduce((sum, order) => sum + order.amountRmb, 0);
    const todayUsedTokens = mockUsageRecords
      .filter((record) => record.createdAt.startsWith(todayPrefix))
      .reduce((sum, record) => sum + record.costTokens, 0);
    return {
      users: { total: mockUsers.length, active: mockUsers.filter((user) => user.status === 'ACTIVE').length },
      agents: { total: mockAgents.length, published: mockAgents.filter((agent) => agent.status === 'PUBLISHED').length, drafts: mockAgents.filter((agent) => agent.status === 'DRAFT').length },
      billing: { todayRechargeRmb, todayUsedAgentTokens: todayUsedTokens, transactionCount: mockTokenTransactions.length },
      runtime: { providerMode: 'mock', readyForAdminStudio: true },
    };
  }
}
