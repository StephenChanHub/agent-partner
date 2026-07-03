import { FormEvent, useEffect, useRef, useState } from 'react';
import { InitialAvatar } from './InitialAvatar';
import { authApi } from '../api/authApi';
import { saveAuthenticatedSession } from '../state/userSession';
import './UserAuthModal.css';

type UserAuthModalProps = {
  onClose: () => void;
  onLogin?: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserAuthModal({ onClose, onLogin }: UserAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [notice, setNotice] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const honeypotRef = useRef('');
  const createdAtRef = useRef(Date.now());

  useEffect(() => {
    if (codeCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCodeCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [codeCooldown]);

  const validateBase = () => {
    if (honeypotRef.current) throw new Error('Request intercepted.');
    if (Date.now() - createdAtRef.current < 600) throw new Error('Operation too fast, please try again.');
    if (!EMAIL_RE.test(email.trim())) throw new Error('Please enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  };

  const sendCode = async () => {
    setNotice(null);
    if (codeCooldown > 0 || codeSending) return;
    try {
      if (!EMAIL_RE.test(email.trim())) throw new Error('Please enter a valid email address first.');
      setCodeSending(true);
      const res = await authApi.sendRegisterCode(email.trim());
      setCodeCooldown(60);
      setNotice({ type: 'info', text: res.mockCode ? `Verification code: ${res.mockCode}` : 'Verification code sent. Please check your email.' });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send verification code.' });
    } finally {
      setCodeSending(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    try {
      validateBase();
      setLoading(true);
      const payload = mode === 'login'
        ? await authApi.login({ email: email.trim(), password })
        : await authApi.register({
            email: email.trim(),
            password,
            nickname: nickname.trim(),
            verificationCode: verificationCode.trim(),
          });
      saveAuthenticatedSession(payload);
      onLogin?.();
      onClose();
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : (mode === 'login' ? 'Login failed.' : 'Registration failed.') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-layer" role="presentation" onClick={onClose}>
      <section className={`auth-card auth-card--${mode}`} role="dialog" aria-modal="true" aria-label="Sign in or register" onClick={(event) => event.stopPropagation()}>
        <button className="auth-close" type="button" aria-label="Close" onClick={onClose}>×</button>

        <div className="auth-brand-mark">
          <InitialAvatar name={nickname || email || 'User'} size="md" />
        </div>

        <div className="auth-heading">
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        </div>

        <div className={`auth-mode-switch auth-mode-switch--${mode}`} role="tablist" aria-label="Authentication mode">
          <span className="auth-mode-indicator" aria-hidden="true" />
          <button className={mode === 'login' ? 'auth-mode auth-mode--active' : 'auth-mode'} type="button" onClick={() => { setMode('login'); setNotice(null); }}>Login</button>
          <button className={mode === 'register' ? 'auth-mode auth-mode--active' : 'auth-mode'} type="button" onClick={() => { setMode('register'); setNotice(null); }}>Register</button>
        </div>

        <form className={`auth-form auth-form--${mode}`} onSubmit={submit}>
          <input
            className="auth-hp-field"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            onChange={(event) => { honeypotRef.current = event.target.value; }}
          />
          {mode === 'register' ? (
            <label>
              <span>Nickname</span>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} autoComplete="nickname" required />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} />
          </label>
          {mode === 'register' ? (
            <label>
              <span>Verification code</span>
              <div className="auth-code-row">
                <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} autoComplete="one-time-code" required />
                <button className="auth-code-button" type="button" onClick={sendCode} disabled={codeSending || codeCooldown > 0}>
                  {codeCooldown > 0 ? `${codeCooldown}s` : codeSending ? 'Sending' : 'Send'}
                </button>
              </div>
            </label>
          ) : null}

          {notice ? <p className={`auth-notice auth-notice--${notice.type}`}>{notice.text}</p> : null}

          <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create account'}</button>
        </form>
      </section>
    </div>
  );
}
