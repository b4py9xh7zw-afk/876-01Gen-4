import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  CATEGORY_MAP,
  ROLE_MAP,
  type ExamCategory,
  type ExamUserStatus,
  type UserRole,
} from '@shared/types';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}秒`;
  }
  if (secs === 0) {
    return `${mins}分`;
  }
  return `${mins}分${secs}秒`;
}

export function getCategoryName(category: ExamCategory): string {
  return CATEGORY_MAP[category] || category;
}

export function getRoleName(role: UserRole): string {
  return ROLE_MAP[role] || role;
}

interface StatusInfo {
  name: string;
  color: string;
}

const STATUS_MAP: Record<ExamUserStatus, StatusInfo> = {
  not_started: { name: '未开始', color: 'text-brand-500 bg-brand-50' },
  in_progress: { name: '进行中', color: 'text-gold-600 bg-gold-50' },
  passed: { name: '已通过', color: 'text-green-600 bg-green-50' },
  failed: { name: '未通过', color: 'text-red-600 bg-red-50' },
  expired: { name: '已过期', color: 'text-gray-500 bg-gray-100' },
};

export function getStatusName(status: ExamUserStatus): StatusInfo {
  return STATUS_MAP[status] || { name: status, color: 'text-gray-500 bg-gray-100' };
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
