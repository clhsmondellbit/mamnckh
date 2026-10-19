'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function StaffLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/staff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Không thể đăng nhập.');
      router.push('/staff/dashboard');
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Không thể đăng nhập.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 animate-fadeIn">
      <div className="rounded-3xl border border-[#e2ebd8] bg-white p-8 shadow-xs">
        <div className="text-center mb-6">
          <span className="grid size-14 mx-auto place-items-center rounded-2xl bg-[#e4efdf] text-2xl mb-3">🔐</span>
          <h1 className="text-2xl font-extrabold text-[#2c4a24]">Đăng nhập nhân sự</h1>
          <p className="text-xs text-slate-500 mt-1">Dành cho bộ phận hỗ trợ và quản lý của trường.</p>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <label className="block text-xs font-bold text-[#2c4a24] space-y-1.5">
            <span>Mật khẩu nhân sự</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3.5 font-normal outline-none transition-all focus:border-[#2d4a22] focus:ring-2 focus:ring-[#2d4a22]/20 text-sm text-slate-800"
              required
              placeholder="Nhập mật khẩu..."
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#2d4a22] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#1f3617] hover:shadow-md disabled:opacity-50 cursor-pointer shadow-xs"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập 🚀'}
          </button>

          {error ? (
            <p role="alert" className="text-center text-xs text-[#9e4a4a]">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}