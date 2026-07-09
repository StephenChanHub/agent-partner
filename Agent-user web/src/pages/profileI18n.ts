export type ProfileLocale = 'en' | 'zh-CN' | 'zh-TW' | 'es' | 'ja' | 'ko';

export const PROFILE_LOCALE_OPTIONS: { value: ProfileLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'es', label: 'Español' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
];

export const DEFAULT_PROFILE_LOCALE: ProfileLocale = 'en';

const PROFILE_LOCALE_STORAGE_KEY = 'agent-user-web:profile-locale';

const PROFILE_LOCALE_SET = new Set<ProfileLocale>(
  PROFILE_LOCALE_OPTIONS.map((option) => option.value),
);

export function readProfileLocale(): ProfileLocale {
  try {
    const stored = window.localStorage.getItem(PROFILE_LOCALE_STORAGE_KEY);
    if (stored && PROFILE_LOCALE_SET.has(stored as ProfileLocale)) {
      return stored as ProfileLocale;
    }
  } catch {
    // Ignore storage read errors and fall back to the default locale.
  }
  return DEFAULT_PROFILE_LOCALE;
}

export function saveProfileLocale(locale: ProfileLocale) {
  try {
    window.localStorage.setItem(PROFILE_LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage write errors; the in-memory locale still applies for this visit.
  }
}

const NUMBER_LOCALES: Record<ProfileLocale, string> = {
  en: 'en-US',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  es: 'es-ES',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

type ProfileCopy = {
  back: string;
  profile: string;
  logout: string;
  profileOverview: string;
  openWallet: string;
  tokens: string;
  personalInformation: string;
  nickname: string;
  email: string;
  emailImmutableHint: string;
  copyEmail: string;
  copied: string;
  changePassword: string;
  newPassword: string;
  confirmPassword: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  emailCode: string;
  emailCodePlaceholder: string;
  sendCode: string;
  updatePassword: string;
  passwordSaved: string;
  saveProfile: string;
  saved: string;
  generalSettings: string;
  appearance: string;
  appearanceSystem: string;
  appearanceLight: string;
  appearanceDark: string;
  language: string;
};

const COPY: Record<ProfileLocale, ProfileCopy> = {
  en: {
    back: 'Back',
    profile: 'Profile',
    logout: 'Logout',
    profileOverview: 'Profile overview',
    openWallet: 'Open wallet',
    tokens: 'Tokens',
    personalInformation: 'Personal information',
    nickname: 'Nickname',
    email: 'Email',
    emailImmutableHint: 'Email cannot be changed in V1 sandbox.',
    copyEmail: 'Copy email',
    copied: 'copied',
    changePassword: 'Change password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    newPasswordPlaceholder: 'Reserved for Core auth',
    confirmPasswordPlaceholder: 'Repeat new password',
    emailCode: 'Email Code',
    emailCodePlaceholder: '6-digit code',
    sendCode: 'Send code',
    updatePassword: 'Update password',
    passwordSaved: 'Password saved',
    saveProfile: 'Save profile',
    saved: 'Saved',
    generalSettings: 'General settings',
    appearance: 'Appearance',
    appearanceSystem: 'System',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    language: 'Language',
  },
  'zh-CN': {
    back: '返回',
    profile: '个人资料',
    logout: '退出登录',
    profileOverview: '个人资料概览',
    openWallet: '打开钱包',
    tokens: '代币',
    personalInformation: '个人信息',
    nickname: '昵称',
    email: '邮箱',
    emailImmutableHint: 'V1 沙盒环境中邮箱不可修改。',
    copyEmail: '复制邮箱',
    copied: '已复制',
    changePassword: '修改密码',
    newPassword: '新密码',
    confirmPassword: '确认密码',
    newPasswordPlaceholder: '预留用于 Core 认证',
    confirmPasswordPlaceholder: '再次输入新密码',
    emailCode: '邮箱验证码',
    emailCodePlaceholder: '6 位验证码',
    sendCode: '发送验证码',
    updatePassword: '更新密码',
    passwordSaved: '密码已保存',
    saveProfile: '保存资料',
    saved: '已保存',
    generalSettings: '通用设置',
    appearance: '外观',
    appearanceSystem: '跟随系统',
    appearanceLight: '浅色',
    appearanceDark: '深色',
    language: '语言',
  },
  'zh-TW': {
    back: '返回',
    profile: '個人資料',
    logout: '登出',
    profileOverview: '個人資料概覽',
    openWallet: '開啟錢包',
    tokens: '代幣',
    personalInformation: '個人資訊',
    nickname: '暱稱',
    email: '電子郵件',
    emailImmutableHint: 'V1 沙盒環境中電子郵件不可修改。',
    copyEmail: '複製電子郵件',
    copied: '已複製',
    changePassword: '變更密碼',
    newPassword: '新密碼',
    confirmPassword: '確認密碼',
    newPasswordPlaceholder: '預留用於 Core 認證',
    confirmPasswordPlaceholder: '再次輸入新密碼',
    emailCode: '電子郵件驗證碼',
    emailCodePlaceholder: '6 位驗證碼',
    sendCode: '發送驗證碼',
    updatePassword: '更新密碼',
    passwordSaved: '密碼已儲存',
    saveProfile: '儲存資料',
    saved: '已儲存',
    generalSettings: '一般設定',
    appearance: '外觀',
    appearanceSystem: '跟隨系統',
    appearanceLight: '淺色',
    appearanceDark: '深色',
    language: '語言',
  },
  es: {
    back: 'Atrás',
    profile: 'Perfil',
    logout: 'Cerrar sesión',
    profileOverview: 'Resumen del perfil',
    openWallet: 'Abrir billetera',
    tokens: 'Tokens',
    personalInformation: 'Información personal',
    nickname: 'Apodo',
    email: 'Correo electrónico',
    emailImmutableHint: 'El correo no se puede cambiar en el entorno sandbox V1.',
    copyEmail: 'Copiar correo',
    copied: 'copiado',
    changePassword: 'Cambiar contraseña',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    newPasswordPlaceholder: 'Reservado para autenticación Core',
    confirmPasswordPlaceholder: 'Repite la nueva contraseña',
    emailCode: 'Código de correo',
    emailCodePlaceholder: 'Código de 6 dígitos',
    sendCode: 'Enviar código',
    updatePassword: 'Actualizar contraseña',
    passwordSaved: 'Contraseña guardada',
    saveProfile: 'Guardar perfil',
    saved: 'Guardado',
    generalSettings: 'Configuración general',
    appearance: 'Apariencia',
    appearanceSystem: 'Sistema',
    appearanceLight: 'Claro',
    appearanceDark: 'Oscuro',
    language: 'Idioma',
  },
  ja: {
    back: '戻る',
    profile: 'プロフィール',
    logout: 'ログアウト',
    profileOverview: 'プロフィール概要',
    openWallet: 'ウォレットを開く',
    tokens: 'トークン',
    personalInformation: '個人情報',
    nickname: 'ニックネーム',
    email: 'メールアドレス',
    emailImmutableHint: 'V1 サンドボックスではメールアドレスは変更できません。',
    copyEmail: 'メールをコピー',
    copied: 'コピー済み',
    changePassword: 'パスワード変更',
    newPassword: '新しいパスワード',
    confirmPassword: 'パスワード確認',
    newPasswordPlaceholder: 'Core 認証用に予約',
    confirmPasswordPlaceholder: '新しいパスワードを再入力',
    emailCode: 'メール認証コード',
    emailCodePlaceholder: '6桁のコード',
    sendCode: 'コードを送信',
    updatePassword: 'パスワードを更新',
    passwordSaved: 'パスワードを保存しました',
    saveProfile: 'プロフィールを保存',
    saved: '保存しました',
    generalSettings: '一般設定',
    appearance: '外観',
    appearanceSystem: 'システム',
    appearanceLight: 'ライト',
    appearanceDark: 'ダーク',
    language: '言語',
  },
  ko: {
    back: '뒤로',
    profile: '프로필',
    logout: '로그아웃',
    profileOverview: '프로필 개요',
    openWallet: '지갑 열기',
    tokens: '토큰',
    personalInformation: '개인 정보',
    nickname: '닉네임',
    email: '이메일',
    emailImmutableHint: 'V1 샌드박스에서는 이메일을 변경할 수 없습니다.',
    copyEmail: '이메일 복사',
    copied: '복사됨',
    changePassword: '비밀번호 변경',
    newPassword: '새 비밀번호',
    confirmPassword: '비밀번호 확인',
    newPasswordPlaceholder: 'Core 인증용 예약',
    confirmPasswordPlaceholder: '새 비밀번호 다시 입력',
    emailCode: '이메일 인증 코드',
    emailCodePlaceholder: '6자리 코드',
    sendCode: '코드 보내기',
    updatePassword: '비밀번호 업데이트',
    passwordSaved: '비밀번호 저장됨',
    saveProfile: '프로필 저장',
    saved: '저장됨',
    generalSettings: '일반 설정',
    appearance: '모양',
    appearanceSystem: '시스템',
    appearanceLight: '라이트',
    appearanceDark: '다크',
    language: '언어',
  },
};

export function getProfileCopy(locale: ProfileLocale): ProfileCopy {
  return COPY[locale] ?? COPY.en;
}

export function formatProfileTokens(value: number, locale: ProfileLocale) {
  return value.toLocaleString(NUMBER_LOCALES[locale] ?? NUMBER_LOCALES.en);
}
