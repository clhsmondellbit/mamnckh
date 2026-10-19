'use client';

import { useEffect, useState } from 'react';

type SupportRequest = { id: string; preferredName?: string; contactPreference?: string; topic: string; supportLevel: string; studentNote?: string; requestedSupport?: string; status: 'new' | 'in_progress' | 'resolved'; assignedStaff?: string; followUpDate?: string; internalNotes?: string; createdAt: string };

export function StaffRequestList() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  useEffect(() => { fetch('/api/support-requests').then(async (response) => { const body = (await response.json()) as { requests?: SupportRequest[]; error?: string }; if (!response.ok) throw new Error(body.error); setRequests(body.requests || []); setStatus('ready'); }).catch((error: unknown) => { setMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu.'); setStatus('error'); }); }, []);
  async function updateStatus(request: SupportRequest, nextStatus: SupportRequest['status']) {
    setSavingId(request.id);
    try {
      const response = await fetch(`/api/support-requests/${request.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus, assignedStaff: request.assignedStaff, followUpDate: request.followUpDate, internalNotes: request.internalNotes }) });
      const body = (await response.json()) as { request?: SupportRequest; error?: string };
      if (!response.ok || !body.request) throw new Error(body.error || 'Không thể cập nhật trạng thái.');
      setRequests((current) => current.map((item) => item.id === request.id ? body.request! : item));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái.'); }
    finally { setSavingId(null); }
  }
  if (status === 'loading') return <p className="mt-8 text-slate-600">Đang tải yêu cầu…</p>;
  if (status === 'error') return <div className="card mt-8 p-6"><p className="font-bold text-[#9d403f]">{message}</p><p className="mt-2 text-sm leading-6 text-slate-700">Khu vực nhân sự chỉ hoạt động sau khi nhà trường đã cấu hình cơ sở dữ liệu, xác thực và phân quyền.</p></div>;
  if (requests.length === 0) return <div className="card mt-8 p-6 text-slate-700">Chưa có yêu cầu hỗ trợ tự nguyện nào.</div>;
  return <div className="mt-8 space-y-4">{requests.map((request) => <article className="card p-5" key={request.id}><div className="flex flex-wrap justify-between gap-2"><div><p className="font-bold text-ink">{request.preferredName || 'Học sinh chưa nêu tên'}</p><p className="mt-1 text-sm text-slate-600">{request.topic.replaceAll('_', ' ')} · {new Date(request.createdAt).toLocaleString('vi-VN')}</p></div><label className="text-sm font-bold text-slate-700">Trạng thái<select value={request.status} disabled={savingId === request.id} onChange={(event) => updateStatus(request, event.target.value as SupportRequest['status'])} className="ml-2 rounded-lg border border-moss-100 bg-white p-2 font-normal"><option value="new">Mới</option><option value="in_progress">Đang hỗ trợ</option><option value="resolved">Đã hoàn tất</option></select></label></div>{request.studentNote ? <p className="mt-4 rounded-xl bg-[#fbfaf7] p-3 leading-6 text-slate-700">{request.studentNote}</p> : null}{request.contactPreference ? <p className="mt-3 text-sm text-slate-700"><strong>Cách liên hệ:</strong> {request.contactPreference}</p> : null}</article>)}</div>;
}
