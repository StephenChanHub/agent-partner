import dayjs from 'dayjs';

export function fmtDate(value?: string | null) {
  if (!value) return '-';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

export function fmtTokens(value?: number | null) {
  return `${Number(value ?? 0).toLocaleString()} Tokens`;
}

export function fmtRmb(value?: number | null) {
  return `¥${Number(value ?? 0).toLocaleString()}`;
}
