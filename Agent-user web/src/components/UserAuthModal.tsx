import { FormEvent, useState } from 'react';
import { InitialAvatar } from './InitialAvatar';
import { demoUserSession, loginWithDemoAccount } from '../state/userSession';
import './UserAuthModal.css';

type UserAuthModalProps = {
  onClose: () => void;
  onLogin?: () => void;
};

export function UserAuthModal({ onClose, onLogin }: UserAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(demoUserSession.email);
  const [password, setPassword] = useState('demo123456');
  const [nickname, setNickname] = useState(demoUserSession.nickname);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    loginWithDemoAccount();
    onLogin?.();
    onClose();
  };

  return (
    <div className="auth-modal-layer" role="presentation" onClick={onClose}>
      <section className={`auth-card auth-card--${mode}`} role="dialog" aria-modal="true" aria-label="Sign in or register" onClick={(event) => event.stopPropagation()}>
        <button className="auth-close" type="button" aria-label="Close" onClick={onClose}>×</button>

        <div className="auth-brand-mark">
          <InitialAvatar name={nickname || 'Stephen'} size="md" />
        </div>

        <div className="auth-heading">
          <span>DID Agent Partner</span>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p>Sandbox login is pre-filled for local testing. The card is ready for real email verification and JWT login.</p>
        </div>

        <div className={`auth-mode-switch auth-mode-switch--${mode}`} role="tablist" aria-label="Authentication mode">
          <span className="auth-mode-indicator" aria-hidden="true" />
          <button className={mode === 'login' ? 'auth-mode auth-mode--active' : 'auth-mode'} type="button" onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'auth-mode auth-mode--active' : 'auth-mode'} type="button" onClick={() => setMode('register')}>Register</button>
        </div>

        <form className={`auth-form auth-form--${mode}`} onSubmit={submit}>
          {mode === 'register' ? (
            <label>
              <span>Nickname</span>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} autoComplete="nickname" />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
          {mode === 'register' ? (
            <label>
              <span>Verification code</span>
              <input value="123456" readOnly aria-label="Mock verification code" />
            </label>
          ) : null}

          <button className="auth-submit" type="submit">{mode === 'login' ? 'Login with demo account' : 'Create demo account'}</button>
        </form>
      </section>
    </div>
  );
}
