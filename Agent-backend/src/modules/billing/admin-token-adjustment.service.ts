import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { mockTokenTransactions, mockUsers } from '../../mock/mock-data';
import { AdminAdjustAgentTokensDto } from './dto/admin-adjust-agent-tokens.dto';

@Injectable()
export class AdminTokenAdjustmentService {
  addTokens(input: { userId: string; adminUserId: string; dto: AdminAdjustAgentTokensDto }) {
    const user = mockUsers.find((item) => item.id === input.userId) as any;
    if (!user) throw new NotFoundException('User not found');

    const amount = Number((input.dto as any).amountAgentTokens ?? (input.dto as any).amountTokens);
    if (!amount || amount <= 0) throw new BadRequestException('amountAgentTokens must be greater than 0.');

    const max = Number(process.env.ADMIN_TOKEN_ADJUST_MAX_AMOUNT ?? 100000);
    if (amount > max) throw new BadRequestException(`Single adjustment cannot exceed ${max} Agent Tokens.`);
    if (!input.dto.reason) throw new BadRequestException('reason is required.');

    const before = user.balanceTokens;
    user.balanceTokens += amount;
    const transaction = {
      id: `txn_admin_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      type: 'ADMIN_RECHARGE',
      direction: 'CREDIT',
      amountTokens: amount,
      balanceBefore: before,
      balanceAfter: user.balanceTokens,
      relatedOrderId: null,
      relatedUsageRecordId: null,
      operatorAdminId: input.adminUserId,
      description: input.dto.reason,
      createdAt: new Date().toISOString(),
    };
    mockTokenTransactions.unshift(transaction as any);

    return {
      userId: user.id,
      balanceBefore: before,
      amountTokens: amount,
      balanceAfter: user.balanceTokens,
      transaction,
    };
  }
}
