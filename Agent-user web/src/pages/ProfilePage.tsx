import { FormEvent, useState } from 'react';
import { InitialAvatar } from '../components/InitialAvatar';
import { demoUserSession, loginWithDemoAccount, logoutUserSession, updateUserSession, useUserSession } from '../state/userSession';
import {
  formatProfileTokens,
  getProfileCopy,
  PROFILE_LOCALE_OPTIONS,
  readProfileLocale,
  saveProfileLocale,
  type ProfileLocale,
} from './profileI18n';
import './ProfilePage.css';

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new Event('agent-user-web:navigate'));
}

export function ProfilePage() {
  const session = useUserSession();
  const [nickname, setNickname] = useState(session.isLoggedIn ? session.nickname : demoUserSession.nickname);
  const email = session.isLoggedIn ? session.email : demoUserSession.email;
  const [locale, setLocale] = useState<ProfileLocale>(() => readProfileLocale());
  const [appearance, setAppearance] = useState(session.appearance);
  const t = getProfileCopy(locale);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = async () => {
    if (!email) {
      return;
    }
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = email;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2000);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!session.isLoggedIn) {
      loginWithDemoAccount();
    }
    updateUserSession({
      isLoggedIn: true,
      nickname: nickname.trim() || demoUserSession.nickname,
      // Email is intentionally immutable in the user web profile editor.
      email,
      initials: (nickname.trim() || demoUserSession.nickname).charAt(0).toUpperCase(),
      appearance,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const submitPasswordChange = () => {
    setPasswordSaved(true);
    setNewPassword('');
    setConfirmPassword('');
    setEmailCode('');
    window.setTimeout(() => setPasswordSaved(false), 1400);
  };

  const handleSendEmailCode = () => {
    // Reserved for email verification password reset.
  };

  return (
    <main className="profile-shell">
      <header className="profile-header">
        <button className="profile-back-button" type="button" aria-label={t.back} onClick={goBack}>←</button>
        <div className="profile-title">{t.profile}</div>
        <button
          className="profile-logout-button"
          type="button"
          onClick={() => {
            logoutUserSession();
            goBack();
          }}
        >
          {t.logout}
        </button>
      </header>

      <section className="profile-hero-card" aria-label={t.profileOverview}>
        <div className="profile-identity-block">
          <InitialAvatar name={nickname || session.nickname} size="lg" className="profile-hero-avatar" />
          <div>
            <h1>{nickname || session.nickname}</h1>
          </div>
        </div>
        <button className="profile-token-summary" type="button" aria-label={t.openWallet} onClick={() => {
          window.history.pushState({}, '', '/wallet');
          window.dispatchEvent(new Event('agent-user-web:navigate'));
        }}>
          <span className="profile-token-word">{t.tokens}</span>
          <strong>{formatProfileTokens(session.tokens, locale)}</strong>
        </button>
      </section>

      <form className="profile-form-card" onSubmit={submit}>
        <div className="profile-section-heading">
          <h2>{t.personalInformation}</h2>
        </div>

        <label className="profile-field">
          <span>{t.nickname}</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <div className="profile-field profile-field--disabled" title={t.emailImmutableHint}>
          <span>{t.email}</span>
          <div className="profile-email-input-wrap">
            <input type="email" value={email} readOnly aria-disabled="true" aria-label={t.email} />
            <button
              className={`profile-email-copy-btn ${emailCopied ? 'profile-email-copy-btn--copied' : ''}`}
              type="button"
              onClick={handleCopyEmail}
              aria-label={t.copyEmail}
            >
              {emailCopied ? t.copied : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="profile-password-section" aria-label={t.changePassword}>
          <div className="profile-password-heading">
            <h3>{t.changePassword}</h3>
          </div>
          <div className="profile-password-body">
            <div className="profile-password-fields">
              <label className="profile-field">
                <span>{t.newPassword}</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={t.newPasswordPlaceholder}
                  autoComplete="new-password"
                />
              </label>
              <label className="profile-field">
                <span>{t.confirmPassword}</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                />
              </label>
            </div>
            <div className="profile-email-code-block">
              <label className="profile-field">
                <span>{t.emailCode}</span>
                <div className="profile-email-code-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={emailCode}
                    onChange={(event) => setEmailCode(event.target.value)}
                    placeholder={t.emailCodePlaceholder}
                    autoComplete="one-time-code"
                    maxLength={6}
                  />
                  <button
                    className="profile-email-code-send"
                    type="button"
                    onClick={handleSendEmailCode}
                  >
                    {t.sendCode}
                  </button>
                </div>
              </label>
            </div>
          </div>
          <button className="profile-password-button" type="button" onClick={submitPasswordChange}>
            {passwordSaved ? t.passwordSaved : t.updatePassword}
          </button>
        </div>

        <button className="profile-save-button" type="submit">{saved ? t.saved : t.saveProfile}</button>
      </form>

      <section className="profile-settings-card" aria-label={t.generalSettings}>
        <div className="profile-section-heading profile-section-heading--settings">
          <h2>{t.generalSettings}</h2>
        </div>

        <div className="profile-setting-grid">
          <label className="profile-field">
            <span>{t.appearance}</span>
            <select value={appearance} onChange={(event) => setAppearance(event.target.value as typeof appearance)}>
              <option value="system">{t.appearanceSystem}</option>
              <option value="light">{t.appearanceLight}</option>
              <option value="dark">{t.appearanceDark}</option>
            </select>
          </label>
          <label className="profile-field">
            <span>{t.language}</span>
            <select
              value={locale}
              onChange={(event) => {
                const nextLocale = event.target.value as ProfileLocale;
                setLocale(nextLocale);
                saveProfileLocale(nextLocale);
              }}
            >
              {PROFILE_LOCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </main>
  );
}
