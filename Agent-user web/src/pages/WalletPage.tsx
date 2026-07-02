import { useEffect, useState } from 'react';
import { InitialAvatar } from '../components/InitialAvatar';
import { updateUserSession, useUserSession } from '../state/userSession';
import { walletApi } from '../api/walletApi';
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

function mapApiPackages(apiPackages: import('../api/walletApi').ApiRechargePackage[]): RechargePackage[] {
  return apiPackages.map((pkg) => ({
    id: pkg.id,
    label: pkg.name,
    amountRmb: pkg.amountRmb,
    tokens: pkg.agentTokens,
    badge: pkg.discountPercent > 0 ? `+${pkg.discountPercent}%` : undefined,
  }));
}

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

function formatTokenWheelValue(value: number) {
  return String(Math.max(0, Math.floor(value)));
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
  const [orders, setOrders] = useState(initialOrders);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [balance, setBalance] = useState(session.tokens);
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [activePackageId, setActivePackageId] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions'>('orders');
  const [payModalPackage, setPayModalPackage] = useState<RechargePackage | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    walletApi.getPackages().then((apiPackages) => {
      if (cancelled) return;
      const mapped = mapApiPackages(apiPackages);
      setPackages(mapped);
      if (mapped.length > 0 && !activePackageId) {
        setActivePackageId(mapped[0].id);
      }
    }).catch(() => {
      // Fallback: keep using empty state; recharge grid will show nothing
    }).finally(() => {
      if (!cancelled) setPackagesLoading(false);
    });
    return () => { cancelled = true; };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const createMockOrder = (pkg: RechargePackage) => {
    const now = Date.now();
    const nextOrder: RechargeOrder = {
      id: `RO-SANDBOX-${String(now).slice(-6)}`,
      createdAt: 'Just now',
      amountRmb: pkg.amountRmb,
      tokens: pkg.tokens,
      status: 'PAID',
    };
    setOrders((current) => [nextOrder, ...current]);
    creditBalance(pkg.tokens, `Mock recharge paid ${nextOrder.id}`);
  };

  const handlePackageClick = (item: RechargePackage) => {
    setActivePackageId(item.id);
    setSelectedPaymentId(null);
    setCopied(false);
    setPayModalPackage(item);
  };

  const handlePayConfirmed = () => {
    if (!payModalPackage) return;
    createMockOrder(payModalPackage);
    setPayModalPackage(null);
    setCopied(false);
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
        <h1><span className="wallet-token-word">Tokens</span><span className="wallet-token-colon">：</span><RollingTokens value={balance} /></h1>
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

      {payModalPackage ? (() => {
        const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentId) ?? null;
        const isExpanded = selectedPaymentId !== null;
        const userEmail = session.email;

        const handleCopyEmail = async () => {
          try {
            await navigator.clipboard.writeText(userEmail);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Fallback for older browsers
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
                      type="email"
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
                  为保障支付安全，请点击复制邮箱，并在付款页面粘贴填写，以完成身份二次确认。电脑端可直接扫码支付，移动端可长按二维码选择在支付宝/微信中打开支付。如没有显示跳转，请保存二维码图片后在支付宝/微信中打开支付。支付完成后回到本页面点击“Payed”按钮即可完成充值（五分钟内到账，未到账请联系公众号 DID Log客服）。
                  <br />
                  For payment security, please copy your email and paste it on the payment page to complete secondary identity verification.
                </p>
              </>
            ) : null}

            <div className="pay-modal-actions">
              <button className="pay-btn-cancel" type="button" onClick={handleClose}>
                Cancel
              </button>
              {isExpanded ? (
                <button
                  className="pay-btn-confirm"
                  type="button"
                  onClick={handlePayConfirmed}
                >
                  Payed
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
