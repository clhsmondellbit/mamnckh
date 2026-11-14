'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function StaffLogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function logout() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/staff/auth', { method: 'DELETE' });
      if (!response.ok) throw new Error('Chưa thể đăng xuất. Hãy tải lại trang và thử lại.');
      router.replace('/staff/login');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa thể đăng xuất.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex flex-col items-end gap-1">
    <button type="button" className="button-secondary" disabled={busy} onClick={() => void logout()}>
      {busy ? 'Đang đăng xuất…' : 'Đăng xuất'}
    </button>
    {error ? <span role="alert" className="text-xs text-red-700">{error}</span> : null}
  </div>;
}
