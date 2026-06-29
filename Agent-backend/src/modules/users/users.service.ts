import { Injectable, NotFoundException } from '@nestjs/common';
import { mockAdmin, mockRechargeOrders, mockTokenTransactions, mockUsageRecords, mockUsers } from '../../mock/mock-data';

@Injectable()
export class UsersService {
  me(authorization?: string) {
    if (authorization?.includes('mock_access_token_admin')) return mockAdmin;
    return mockUsers[0];
  }

  list(query: any = {}) {
    const keyword = (query.keyword ?? '').toString().toLowerCase();
    const items = mockUsers.filter((user) => !keyword || user.email.toLowerCase().includes(keyword) || user.nickname.toLowerCase().includes(keyword));
    return items;
  }

  get(id: string) {
    const user = mockUsers.find((item) => item.id === id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  getRechargeOrders(id: string) {
    this.get(id);
    return mockRechargeOrders.filter((item) => item.userId === id);
  }

  getTransactions(id: string) {
    this.get(id);
    return mockTokenTransactions.filter((item) => item.userId === id);
  }

  getUsageRecords(id: string) {
    this.get(id);
    return mockUsageRecords.filter((item) => item.userId === id);
  }
}
