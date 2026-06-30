import { FormEvent, useState } from 'react';
import { InitialAvatar } from '../components/InitialAvatar';
import { demoUserSession, loginWithDemoAccount, logoutUserSession, updateUserSession, useUserSession } from '../state/userSession';
import './ProfilePage.css';

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

export function ProfilePage() {
  const session = useUserSession();
  const [nickname, setNickname] = useState(session.isLoggedIn ? session.nickname : demoUserSession.nickname);
  const email = session.isLoggedIn ? session.email : demoUserSession.email;
  const [language, setLanguage] = useState(session.language);
  const [appearance, setAppearance] = useState(session.appearance);
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('demo-password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

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
      language,
      appearance,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const submitPasswordChange = () => {
    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    window.setTimeout(() => setPasswordSaved(false), 1400);
  };

  return (
    <main className="profile-shell">
      <header className="profile-header">
        <button className="profile-back-button" type="button" aria-label="Back" onClick={goBack}>←</button>
        <div className="profile-title">Profile</div>
        <button
          className="profile-logout-button"
          type="button"
          onClick={() => {
            logoutUserSession();
            goBack();
          }}
        >
          Logout
        </button>
      </header>

      <section className="profile-hero-card" aria-label="Profile overview">
        <div className="profile-identity-block">
          <InitialAvatar name={nickname || session.nickname} size="lg" className="profile-hero-avatar" />
          <div>
            <h1>{nickname || session.nickname}</h1>
          </div>
        </div>
        <button className="profile-token-summary" type="button" aria-label="Open wallet" onClick={() => {
          window.history.pushState({}, '', '/wallet');
          window.dispatchEvent(new Event('agent-user-web:navigate'));
        }}>
          <span className="profile-token-word">Tokens</span>
          <strong>{formatTokens(session.tokens)}</strong>
        </button>
      </section>

      <form className="profile-form-card" onSubmit={submit}>
        <div className="profile-section-heading">
          <h2>Personal information</h2>
          <span>Local sandbox profile</span>
        </div>

        <label className="profile-field">
          <span>Nickname</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <label className="profile-field profile-field--disabled" title="Email cannot be changed in V1 sandbox.">
          <span>Email</span>
          <input type="email" value={email} disabled aria-disabled="true" />
        </label>

        <div className="profile-password-section" aria-label="Change password">
          <div className="profile-password-heading">
            <h3>Change password</h3>
            <span>Sandbox only · production API reserved</span>
          </div>
          <div className="profile-password-grid">
            <label className="profile-field">
              <span>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="profile-field">
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Reserved for Core auth"
                autoComplete="new-password"
              />
            </label>
            <label className="profile-field">
              <span>Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </label>
          </div>
          <button className="profile-password-button" type="button" onClick={submitPasswordChange}>
            {passwordSaved ? 'Password saved' : 'Update password'}
          </button>
        </div>

        <button className="profile-save-button" type="submit">{saved ? 'Saved' : 'Save profile'}</button>
      </form>

      <section className="profile-settings-card" aria-label="General settings">
        <div className="profile-section-heading profile-section-heading--settings">
          <h2>General settings</h2>
          <span>Reserved for production</span>
        </div>

        <div className="profile-setting-grid">
          <label className="profile-field">
            <span>Appearance</span>
            <select value={appearance} onChange={(event) => setAppearance(event.target.value as typeof appearance)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="profile-field">
            <span>Language</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option>English</option>
              <option>简体中文</option>
              <option>日本語</option>
            </select>
          </label>
        </div>

        <div className="profile-reserved-list" aria-label="Reserved settings">
          <span>Voice autoplay · reserved</span>
          <span>Notification · reserved</span>
          <span>Device sync · reserved</span>
        </div>
      </section>
    </main>
  );
}
