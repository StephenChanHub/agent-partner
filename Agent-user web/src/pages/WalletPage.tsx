import { useMemo, useState } from 'react';
import { InitialAvatar } from '../components/InitialAvatar';
import { updateUserSession, useUserSession } from '../state/userSession';
import './WalletPage.css';

type RechargePackage = {
  id: string;
  label: string;
  amountRmb: number;
  tokens: number;
  badge?: string;
};

type RechargeOrder = {
  id: string;
  createdAt: string;
  amountRmb: number;
  tokens: number;
  status: 'PENDING' | 'PAID';
};

type TokenTransaction = {
  id: string;
  createdAt: string;
  title: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
};

const packages: RechargePackage[] = [
  { id: 'pkg_5', label: 'Starter', amountRmb: 5, tokens: 5000 },
  { id: 'pkg_10', label: 'Daily', amountRmb: 10, tokens: 10000, badge: 'Popular' },
  { id: 'pkg_30', label: 'Creator', amountRmb: 30, tokens: 33000, badge: '+10%' },
  { id: 'pkg_50', label: 'Pro', amountRmb: 50, tokens: 60000, badge: '+20%' },
];

const initialOrders: RechargeOrder[] = [
  { id: 'RO-20260630-0003', createdAt: 'Today 21:18', amountRmb: 10, tokens: 10000, status: 'PAID' },
  { id: 'RO-20260630-0002', createdAt: 'Today 20:42', amountRmb: 30, tokens: 33000, status: 'PENDING' },
  { id: 'RO-20260629-0001', createdAt: 'Yesterday 16:08', amountRmb: 5, tokens: 5000, status: 'PAID' },
];

const initialTransactions: TokenTransaction[] = [
  { id: 'TX-1005', createdAt: 'Today 21:18', title: 'Recharge order paid', direction: 'CREDIT', amount: 10000, balanceAfter: 10000 },
  { id: 'TX-1004', createdAt: 'Today 20:55', title: 'Voice chat usage', direction: 'DEBIT', amount: 55, balanceAfter: 0 },
  { id: 'TX-1003', createdAt: 'Yesterday 16:08', title: 'Admin manual recharge', direction: 'CREDIT', amount: 5000, balanceAfter: 5000 },
];

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new Event('agent-user-web:navigate'));
}

function formatTokens(value: number) {
  return value.toLocaleString('en-US');
}

function RollingTokens({ value }: { value: number }) {
  const text = formatTokens(value);
  return (
    <span className="slot-balance" aria-label={`${text} tokens`}>
      {text.split('').map((char, index) => (
        <span className="slot-balance-digit" key={`${value}_${index}_${char}`} style={{ animationDelay: `${index * 28}ms` }}>
          {char}
        </span>
      ))}
    </span>
  );
}

export function WalletPage() {
  const session = useUserSession();
  const [orders, setOrders] = useState(initialOrders);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [balance, setBalance] = useState(session.tokens);
  const [activePackageId, setActivePackageId] = useState(packages[1].id);
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions'>('orders');

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === activePackageId) ?? packages[0],
    [activePackageId],
  );

  const creditBalance = (tokens: number, title: string) => {
    setBalance((currentBalance) => {
      const nextBalance = currentBalance + tokens;
      updateUserSession({ tokens: nextBalance });
      setTransactions((current) => [
        {
          id: `TX-SANDBOX-${String(Date.now()).slice(-6)}`,
          createdAt: 'Just now',
          title,
          direction: 'CREDIT',
          amount: tokens,
          balanceAfter: nextBalance,
        },
        ...current,
      ]);
      return nextBalance;
    });
  };

  const createMockOrder = () => {
    const now = Date.now();
    const nextOrder: RechargeOrder = {
      id: `RO-SANDBOX-${String(now).slice(-6)}`,
      createdAt: 'Just now',
      amountRmb: selectedPackage.amountRmb,
      tokens: selectedPackage.tokens,
      status: 'PAID',
    };
    setOrders((current) => [nextOrder, ...current]);
    creditBalance(selectedPackage.tokens, `Mock recharge paid ${nextOrder.id}`);
  };

  const mockPayOrder = (order: RechargeOrder) => {
    if (order.status === 'PAID') return;
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status: 'PAID' } : item)),
    );
    creditBalance(order.tokens, `Recharge paid ${order.id}`);
  };

  return (
    <main className="wallet-shell">
      <header className="wallet-header">
        <button className="wallet-back-button" type="button" onClick={goBack} aria-label="Back">
          ←
        </button>
        <div className="wallet-user-title" aria-label="Current user">
          <InitialAvatar name={session.nickname} size="sm" className="wallet-user-avatar" />
          <span>{session.nickname}</span>
        </div>
        <div aria-hidden="true" />
      </header>

      <section className="wallet-balance-card" aria-label="Current token balance">
        <span className="wallet-eyebrow">Current balance</span>
        <h1><span className="wallet-token-word">Tokens</span>：<RollingTokens value={balance} /></h1>
        <p>Sandbox wallet is using local mock data. The structure is ready for Core recharge order, payment callback, and token transaction APIs.</p>
      </section>

      <section className="wallet-section" aria-labelledby="recharge-title">
        <div className="wallet-section-heading">
          <h2 id="recharge-title">Recharge</h2>
          <span>Mock payment · production API reserved</span>
        </div>

        <div className="recharge-grid">
          {packages.map((item) => (
            <button
              key={item.id}
              className={`recharge-package ${item.id === activePackageId ? 'recharge-package--active' : ''}`}
              type="button"
              onClick={() => setActivePackageId(item.id)}
            >
              {item.badge ? <span className="package-badge">{item.badge}</span> : null}
              <strong>{item.label}</strong>
              <span className="package-price">¥{item.amountRmb}</span>
              <span className="package-tokens">{formatTokens(item.tokens)} Tokens</span>
            </button>
          ))}
        </div>

        <button className="create-order-button" type="button" onClick={createMockOrder}>
          Create mock order
        </button>
      </section>

      <section className="wallet-section wallet-records" aria-label="Wallet records">
        <div className="wallet-tabs" role="tablist" aria-label="Wallet record tabs">
          <button className={activeTab === 'orders' ? 'wallet-tab wallet-tab--active' : 'wallet-tab'} type="button" onClick={() => setActiveTab('orders')}>
            Orders
          </button>
          <button className={activeTab === 'transactions' ? 'wallet-tab wallet-tab--active' : 'wallet-tab'} type="button" onClick={() => setActiveTab('transactions')}>
            Token flow
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="record-list">
            {orders.map((order) => (
              <article className="record-card" key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <span>{order.createdAt}</span>
                </div>
                <div className="record-right">
                  <b>¥{order.amountRmb} / {formatTokens(order.tokens)}</b>
                  {order.status === 'PENDING' ? (
                    <button className="mock-pay-button" type="button" onClick={() => mockPayOrder(order)}>
                      Mock pay
                    </button>
                  ) : (
                    <em>Paid</em>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="record-list">
            {transactions.map((transaction) => (
              <article className="record-card" key={transaction.id}>
                <div>
                  <strong>{transaction.title}</strong>
                  <span>{transaction.createdAt} · {transaction.id}</span>
                </div>
                <div className="record-right">
                  <b className={transaction.direction === 'CREDIT' ? 'tokens-credit' : 'tokens-debit'}>
                    {transaction.direction === 'CREDIT' ? '+' : '-'}{formatTokens(transaction.amount)}
                  </b>
                  <em>After {formatTokens(transaction.balanceAfter)}</em>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
