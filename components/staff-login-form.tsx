'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function StaffLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/staff/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Không thể đăng nhập.');
      router.push('/staff/dashboard'); router.refresh();
    } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Không thể đăng nhập.'); }
    finally { setLoading(false); }
  }
  return <form className="card mt-7 p-6" onSubmit={submit}><label className="block text-sm font-bold text-ink">Mật khẩu nhân sự<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-moss-100 p-3 font-normal outline-none focus:border-moss-600" required /></label><button className="button-primary mt-5" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>{error ? <p role="alert" className="mt-3 text-sm text-[#9d403f]">{error}</p> : null}</form>;
}
