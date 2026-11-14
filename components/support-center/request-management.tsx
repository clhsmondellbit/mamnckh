'use client';

import { FormEvent, useState } from 'react';

function localDateToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function SupportRequestManagement() {
  const [requestId, setRequestId] = useState('');
  const [token, setToken] = useState('');
  const [date, setDate] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [action, setAction] = useState<'cancel' | 'reschedule'>('cancel');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const isCancel = action === 'cancel';
      const response = await fetch(isCancel ? `/api/appointments/${requestId}/cancel` : `/api/appointments/${requestId}`, {
        method: isCancel ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isCancel
          ? { cancellationToken: token }
          : { cancellationToken: token, requestedDate: date, requestedTimeWindow: timeWindow }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Không thể cập nhật yêu cầu.');
      setMessage(isCancel
        ? 'Yêu cầu đã được hủy. Nếu trước đó có giữ khung giờ, khung giờ đã được giải phóng.'
        : 'Đã gửi đề nghị đổi ngày/khung giờ. Yêu cầu trở về trạng thái chờ xác nhận; chưa có lịch mới được xác nhận.');
      if (isCancel) {
        setRequestId('');
        setToken('');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể cập nhật yêu cầu.');
    } finally {
      setLoading(false);
    }
  }

  return <section className="card mt-5 p-5" aria-labelledby="manage-support-request-title">
    <h2 id="manage-support-request-title" className="text-lg font-bold text-ink">Quản lý yêu cầu đã gửi</h2>
    <p className="mt-1 text-sm leading-6 text-slate-600">Nhập mã yêu cầu và mã quản lý riêng tư đã được cấp sau khi gửi. Hai mã này không được lưu vào tài khoản hoặc nhật ký trình duyệt.</p>
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Mã yêu cầu<input required value={requestId} onChange={(event) => setRequestId(event.target.value.trim())} maxLength={36} pattern="[0-9a-fA-F-]{36}" autoComplete="off" className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="UUID được cấp khi gửi" /></label>
        <label className="text-sm font-semibold">Mã quản lý riêng tư<input required type="password" value={token} onChange={(event) => setToken(event.target.value.trim())} minLength={30} maxLength={100} autoComplete="off" className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Dán mã đã lưu" /></label>
      </div>
      <label className="block text-sm font-semibold">Thao tác<select value={action} onChange={(event) => setAction(event.target.value as 'cancel'|'reschedule')} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="cancel">Hủy yêu cầu</option><option value="reschedule">Đề nghị đổi lịch</option></select></label>
      {action === 'reschedule' ? <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Ngày mong muốn mới<input required type="date" min={localDateToday()} value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
        <label className="text-sm font-semibold">Khung giờ mong muốn mới<input required value={timeWindow} onChange={(event) => setTimeWindow(event.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Ví dụ: sau giờ học" /></label>
      </div> : null}
      <p className="rounded-xl bg-moss-50 p-3 text-xs leading-5 text-slate-600">Đổi lịch chỉ gửi đề nghị mới và cần người nhận xác nhận. Không nhập mã quản lý trên thiết bị dùng chung; người có mã có thể thay đổi hoặc hủy yêu cầu.</p>
      <button type="submit" disabled={loading || !requestId.trim() || token.length < 30 || (action === 'reschedule' && (!date || !timeWindow.trim()))} className={action === 'cancel' ? 'button-danger' : 'button-primary'}>{loading ? 'Đang xử lý…' : action === 'cancel' ? 'Hủy yêu cầu' : 'Gửi đề nghị đổi lịch'}</button>
    </form>
    {message ? <p role="status" className="mt-3 rounded-xl bg-moss-50 p-3 text-sm text-moss-800">{message}</p> : null}
    {error ? <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p> : null}
  </section>;
}
