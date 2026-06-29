import { Injectable } from '@nestjs/common';
import { mockTokenTransactions } from '../../mock/mock-data';

@Injectable()
export class AgentTokenTransactionService {
  listForCurrentUser(_query: any = {}) {
    return mockTokenTransactions.filter((item) => item.userId === 'user_mock_001');
  }

  listAll(query: any = {}) {
    const userId = query.userId;
    return mockTokenTransactions.filter((item) => !userId || item.userId === userId);
  }
}
