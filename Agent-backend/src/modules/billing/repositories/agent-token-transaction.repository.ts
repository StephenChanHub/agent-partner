import { Injectable } from '@nestjs/common';
import { TransactionQueryDto } from '../dto/transaction-query.dto';

@Injectable()
export class AgentTokenTransactionRepository {
  listForCurrentUser(_query: TransactionQueryDto) {
    return { items: [], nextCursor: null };
  }

  adminRecharge(params: {
    userId: string;
    adminUserId: string;
    amountAgentTokens: number;
    reason: string;
  }) {
    // TODO(v1.6): implement with Prisma.$transaction.
    const balanceBefore = 0;
    const balanceAfter = balanceBefore + params.amountAgentTokens;
    return {
      userId: params.userId,
      balanceBefore,
      amountAgentTokens: params.amountAgentTokens,
      balanceAfter,
      transactionId: 'txn_mock_admin_recharge',
    };
  }
}
