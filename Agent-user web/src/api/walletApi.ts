/**
 * Wallet API readiness layer.
 *
 * V1.8.17 still uses local mock state inside WalletPage, but the user-facing
 * page is intentionally aligned with these Core endpoints so production hookup
 * can replace local state without rewriting the page model.
 */
export const walletApiContract = {
  getBalance: 'GET /me/usage',
  getPackages: 'GET /billing/packages',
  createRechargeOrder: 'POST /billing/recharge-orders',
  listRechargeOrders: 'GET /billing/recharge-orders',
  mockPayRechargeOrder: 'POST /billing/recharge-orders/{id}/mock-pay',
  listTokenTransactions: 'GET /billing/transactions',
} as const;

export type WalletApiContract = typeof walletApiContract;
