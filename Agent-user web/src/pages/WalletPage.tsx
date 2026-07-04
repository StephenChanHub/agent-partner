import { useCallback, useEffect, useState } from 'react';
import { InitialAvatar } from '../components/InitialAvatar';
import { isUserLoggedIn, requestUserAuth, updateUserSession, useUserSession } from '../state/userSession';
import { walletApi } from '../api/walletApi';
import type { ApiBillingPricing, ApiRechargeOrder, ApiRechargePackage, ApiTokenTransaction } from '../api/walletApi';
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
  orderNo: string;
  createdAt: string;
  amountRmb: number;
  tokens: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  expiresAt: string;
  paidAt?: string | null;
};

type TokenTransaction = {
  id: string;
  createdAt: string;
  title: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
  qrImage: string;
  deeplink: string;
};

const paymentMethods: PaymentMethod[] = [
  { id: 'alipay', name: 'Alipay', icon: '/alipay.svg', qrImage: '/Alipay.png', deeplink: 'alipays://platformapi/startapp?saId=10000007' },
  { id: 'wechat', name: 'WeChat Pay', icon: '/WeChat.svg', qrImage: '/WeChatPay.png', deeplink: 'weixin://' },
  { id: 'paypal', name: 'PayPal', icon: '/PayPal.svg', qrImage: '/PayPal.svg', deeplink: 'https://www.paypal.com/' },
];

function mapApiPackages(apiPackages: ApiRechargePackage[]): RechargePackage[] {
  return apiPackages.map((pkg) => ({
    id: pkg.id,
    label: pkg.name,
    amountRmb: pkg.amountRmb,
    tokens: pkg.agentTokens,
    badge: pkg.discountPercent > 0 ? `+${pkg.discountPercent}%` : undefined,
  }));
}

function mapApiOrders(apiOrders: ApiRechargeOrder[]): RechargeOrder[] {
  return apiOrders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo || order.id,
    createdAt: order.createdAt,
    amountRmb: order.amountRmb,
    tokens: order.agentTokens,
    status: order.status,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
  }));
}

function mapApiTransactions(apiTransactions: ApiTokenTransaction[]): TokenTransaction[] {
  return apiTransactions.map((transaction) => ({
    id: transaction.id,
    createdAt: transaction.createdAt,
    title: transaction.description || transaction.type,
    direction: transaction.direction,
    amount: transaction.amountTokens,
    balanceAfter: transaction.balanceAfter,
  }));
}

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

function formatTokenWheelValue(value: number) {
  return String(Math.max(0, Math.floor(value)));
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function getOrderStatusText(status: RechargeOrder['status']) {
  if (status === 'PAID') return '已到账';
  if (status === 'EXPIRED') return '已取消';
  return '待管理员确认';
}

function getOrderStatusClass(status: RechargeOrder['status']) {
  if (status === 'PAID') return 'order-status-paid';
  if (status === 'EXPIRED') return 'order-status-expired';
  return 'order-status-pending';
}

const wheelDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function RollingDigit({ digit, index }: { digit: string; index: number }) {
  const digitNumber = Number(digit);

  return (
    <span className="slot-balance-wheel" aria-hidden="true">
      <span
        className="slot-balance-wheel-track"
        style={{
          transform: `translate3d(0, calc(-${digitNumber} * var(--slot-digit-height)), 0)`,
          transitionDelay: `${index * 36}ms`,
        }}
      >
        {wheelDigits.map((item) => (
          <span className="slot-balance-wheel-number" key={item}>
            {item}
          </span>
        ))}
      </span>
    </span>
  );
}

function RollingTokens({ value }: { value: number }) {
  const text = formatTokenWheelValue(value);

  return (
    <span className="slot-balance" aria-label={`${formatTokens(value)} tokens`}>
      {text.split('').map((char, index) => (
        <RollingDigit digit={char} index={index} key={`${index}_${text.length}`} />
      ))}
    </span>
  );
}

export function WalletPage() {
  const session = useUserSession();
  const [orders, setOrders] = useState<RechargeOrder[]>([]);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [balance, setBalance] = useState(session.tokens);
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [pricing, setPricing] = useState<ApiBillingPricing | null>(null);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [activePackageId, setActivePackageId] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions'>('orders');
  const [payModalPackage, setPayModalPackage] = useState<RechargePackage | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [notice, setNotice] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);

  const isLoggedIn = isUserLoggedIn(session);
  const pendingOrder = isLoggedIn ? orders.find((order) => order.status === 'PENDING') : undefined;

  const refreshWalletData = useCallback(async () => {
    if (!isLoggedIn) {
      setOrders([]);
      setTransactions([]);
      setBalance(0);
      return;
    }

    const [apiOrders, apiTransactions, usage] = await Promise.all([
      walletApi.listRechargeOrders(),
      walletApi.listTokenTransactions(),
      walletApi.getBalance(),
    ]);
    const nextBalance = usage.balanceAgentTokens;
    setOrders(mapApiOrders(apiOrders.items).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setTransactions(mapApiTransactions(apiTransactions.items).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setBalance(nextBalance);
    updateUserSession({ tokens: nextBalance });
  }, [isLoggedIn]);

  useEffect(() => {
    if (payModalPackage) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [payModalPackage]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      walletApi.getPackages(),
      walletApi.getPricing(),
    ]).then(([apiPackages, apiPricing]) => {
      if (cancelled) return;
      const mapped = mapApiPackages(apiPackages);
      setPackages(mapped);
      setPricing(apiPricing);
      if (mapped.length > 0 && !activePackageId) {
        setActivePackageId(mapped[0].id);
      }
    }).catch(() => {
      if (!cancelled) setNotice({ type: 'error', text: '钱包套餐数据加载失败，请确认后端服务已启动。' });
    }).finally(() => {
      if (!cancelled) setPackagesLoading(false);
    });
    return () => { cancelled = true; };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshWalletData().catch(() => {
      if (isLoggedIn) setNotice({ type: 'error', text: '钱包数据加载失败，请确认后端服务已启动。' });
    });
  }, [isLoggedIn, refreshWalletData]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const timer = window.setInterval(() => {
      refreshWalletData().catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [isLoggedIn, refreshWalletData]);

  const handlePackageClick = (item: RechargePackage) => {
    setActivePackageId(item.id);
    setSelectedPaymentId(null);
    setCopied(false);
    setNotice(null);
    setPayModalPackage(item);
  };

  const handlePayConfirmed = async () => {
    if (!payModalPackage || submittingOrder) return;
    if (!isLoggedIn) {
      setPayModalPackage(null);
      setSelectedPaymentId(null);
      setCopied(false);
      requestUserAuth();
      return;
    }
    if (pendingOrder) {
      setNotice({ type: 'error', text: `你有未处理完成的充值订单 ${pendingOrder.orderNo}，请等待管理员确认或 5 分钟自动取消后再下单。` });
      setActiveTab('orders');
      setPayModalPackage(null);
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await walletApi.createRechargeOrder(payModalPackage.id);
      setOrders((current) => [mapApiOrders([order])[0], ...current]);
      setActiveTab('orders');
      setNotice({ type: 'success', text: `订单 ${order.orderNo} 已提交，状态为 Pending。管理员确认后 Tokens 将自动到账；5 分钟未处理会自动取消。` });
      setPayModalPackage(null);
      setCopied(false);
      await refreshWalletData();
    } catch (error) {
      const message = error instanceof Error && error.message.includes('未处理')
        ? error.message
        : '你有未处理完成的充值订单，请先等待管理员确认或订单自动取消后再下单。';
      setNotice({ type: 'error', text: message });
      setActiveTab('orders');
      await refreshWalletData().catch(() => undefined);
    } finally {
      setSubmittingOrder(false);
    }
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
        <h1><img className="wallet-token-logo" src="/Tokens.png" alt="" aria-hidden="true" />
        <span className="wallet-token-word">Tokens</span>
        <span className="wallet-token-colon">ㅤx</span><RollingTokens value={balance} /></h1>
      </section>

      {notice ? (
        <div className={`wallet-notice wallet-notice--${notice.type}`} role="status">
          {notice.text}
        </div>
      ) : null}

      <section className="wallet-section" aria-labelledby="recharge-title">
        <div className="wallet-section-heading">
          <h2 id="recharge-title">Recharge</h2>
          {/* <span>{pricing ? `Live pricing · ¥1 = ${formatTokens(pricing.agentTokensPerRmb)} Tokens · text min ${formatTokens(pricing.minimumTextBalance)}` : 'Loading live pricing...'}</span> */}
        </div>

        {pendingOrder ? (
          <p className="wallet-pending-hint">
            当前有待处理订单 {pendingOrder.orderNo}，管理员确认后自动到账；若 5 分钟未确认，系统会自动取消。
          </p>
        ) : null}

        <div className="recharge-grid" aria-busy={packagesLoading}>
          {packages.map((item) => (
            <button
              key={item.id}
              className={`recharge-package ${item.id === activePackageId ? 'recharge-package--active' : ''}`}
              type="button"
              onClick={() => handlePackageClick(item)}
            >
              {item.badge ? <span className="package-badge">{item.badge}</span> : null}
              <strong>{item.label}</strong>
              <span className="package-price">¥{item.amountRmb}</span>
              <span className="package-tokens">{formatTokens(item.tokens)} Tokens</span>
            </button>
          ))}
        </div>

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
            {orders.length === 0 ? <p className="wallet-empty-record">暂无充值订单。</p> : null}
            {orders.map((order) => (
              <article className="record-card" key={order.id}>
                <div>
                  <strong>{order.orderNo}</strong>
                  <span>{formatDateTime(order.createdAt)}</span>
                  {order.status === 'PENDING' ? <span>自动取消时间：{formatDateTime(order.expiresAt)}</span> : null}
                </div>
                <div className="record-right">
                  <b>¥{order.amountRmb} / {formatTokens(order.tokens)}</b>
                  <em className={`order-status-pill ${getOrderStatusClass(order.status)}`}>{getOrderStatusText(order.status)}</em>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="record-list">
            {transactions.length === 0 ? <p className="wallet-empty-record">暂无 Token 流水。</p> : null}
            {transactions.map((transaction) => (
              <article className="record-card" key={transaction.id}>
                <div>
                  <strong>{transaction.title}</strong>
                  <span>{formatDateTime(transaction.createdAt)} · {transaction.id}</span>
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

      {payModalPackage ? (() => {
        const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentId) ?? null;
        const isExpanded = selectedPaymentId !== null;
        const userEmail = isLoggedIn ? session.email : 'Please log in first.';

        const handleCopyEmail = async () => {
          if (!isLoggedIn) {
            requestUserAuth();
            return;
          }
          try {
            await navigator.clipboard.writeText(userEmail);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            const textarea = document.createElement('textarea');
            textarea.value = userEmail;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        };

        const handleMethodClick = (methodId: string) => {
          if (selectedPaymentId === methodId) {
            setSelectedPaymentId(null);
            setCopied(false);
          } else {
            setSelectedPaymentId(methodId);
          }
        };

        const handleClose = () => {
          if (submittingOrder) return;
          setPayModalPackage(null);
          setSelectedPaymentId(null);
          setCopied(false);
        };

        const visibleMethods = isExpanded
          ? paymentMethods.filter((m) => m.id === selectedPaymentId)
          : paymentMethods;

        return (
        <div className="pay-modal-layer" role="presentation" onClick={handleClose}>
          <section
            className="pay-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Select payment method"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="pay-modal-title">Please select a payment method:</h3>

            <div className={`pay-methods ${isExpanded ? 'pay-methods--collapsed' : ''}`}>
              {visibleMethods.map((method) => (
                <button
                  key={method.id}
                  className={`pay-method-row ${method.id === selectedPaymentId ? 'pay-method-row--selected' : ''}`}
                  type="button"
                  onClick={() => handleMethodClick(method.id)}
                >
                  <img className="pay-method-icon" src={method.icon} alt={method.name} />
                  <span className="pay-method-name">{method.name}</span>
                </button>
              ))}
            </div>

            {isExpanded && selectedMethod ? (
              <>
                <div className="pay-qr-section">
                  <a
                    className="pay-qr-link"
                    href={selectedMethod.deeplink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      className="pay-qr-image"
                      src={selectedMethod.qrImage}
                      alt={`${selectedMethod.name} payment QR`}
                    />
                  </a>
                </div>

                <div className="pay-email-row">
                  <span className="pay-email-label-text">Email</span>
                  <div className="pay-email-input-wrap">
                    <input
                      className="pay-email-input" aria-label="Your email address for payment verification"
                      type={isLoggedIn ? "email" : "text"}
                      value={userEmail}
                      readOnly
                    />
                    <button
                      className={`pay-copy-btn ${copied ? 'pay-copy-btn--copied' : ''}`}
                      type="button"
                      onClick={handleCopyEmail}
                      aria-label="Copy email"
                    >
                      {copied ? '✓' : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <p className="pay-email-hint">
                  为保障支付安全，请点击复制邮箱，并在付款页面粘贴填写，以完成身份二次确认。当前版本未接入真实支付宝/微信回调，点击 Payed 后会生成 Pending 订单并同步给管理员；管理员确认充值后 Tokens 自动到账，5 分钟未处理订单会自动取消。
                  <br />
                  For payment security, please copy your email and paste it on the payment page. Payed submits a pending order for manual admin confirmation.
                </p>
              </>
            ) : null}

            <div className="pay-modal-actions">
              <button className="pay-btn-cancel" type="button" onClick={handleClose} disabled={submittingOrder}>
                Cancel
              </button>
              {isExpanded ? (
                <button
                  className="pay-btn-confirm"
                  type="button"
                  onClick={handlePayConfirmed}
                  disabled={submittingOrder}
                >
                  {submittingOrder ? 'Submitting...' : 'Payed'}
                </button>
              ) : null}
            </div>
          </section>
        </div>
        );
      })() : null}
    </main>
  );
}
