'use client';

import { FormEvent, useState } from 'react';
import { topicShortcuts } from '@/components/topics';
import type { SupportTopic } from '@/lib/types';

export function HandoffForm({ enabled }: { enabled: boolean }) {
  const [topic, setTopic] = useState<SupportTopic>('other');
  const [preferredName, setPreferredName] = useState('');
  const [contactPreference, setContactPreference] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!enabled || !consent) return;
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/support-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferredName: preferredName || undefined, contactPreference: contactPreference || undefined, topic, supportLevel: 'yellow', studentNote: studentNote || undefined, consent }) });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Chưa thể gửi yêu cầu.');
      setStatus('success');
    } catch (requestError) {
      setStatus('error');
      setError(requestError instanceof Error ? requestError.message : 'Chưa thể gửi yêu cầu.');
    }
  }

  if (status === 'success') return <div className="card border-moss-500 bg-moss-50 p-6"><h2 className="text-xl font-bold text-ink">Yêu cầu của bạn đã được gửi</h2><p className="mt-2 leading-7 text-slate-700">Cảm ơn bạn đã chủ động tìm sự hỗ trợ. Trong lúc chờ phản hồi, nếu bạn thấy không an toàn, hãy tìm một người lớn ở gần bạn ngay.</p></div>;

  return (
    <form className="card p-6 sm:p-8" onSubmit={submit}>
      <h2 className="text-xl font-bold text-ink">Gửi yêu cầu được người thật hỗ trợ</h2>
      <p className="mt-2 leading-7 text-slate-700">Bạn chọn điều gì được chia sẻ. Chỉ thông tin trong biểu mẫu này được gửi; MẦM không tự gửi toàn bộ cuộc trò chuyện của bạn.</p>
      {!enabled ? <p className="mt-5 rounded-xl bg-[#fff7f5] p-4 text-sm leading-6 text-[#743534]">Nhà trường chưa bật biểu mẫu gửi yêu cầu trực tuyến. Bạn vẫn có thể nói trực tiếp với GVCN, giáo viên tin cậy, phụ huynh/người chăm sóc hoặc bộ phận hỗ trợ của trường.</p> : <>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-ink">Tên bạn muốn được gọi <span className="font-normal text-slate-500">(không bắt buộc)</span><input value={preferredName} onChange={(event) => setPreferredName(event.target.value)} maxLength={80} className="mt-2 w-full rounded-xl border border-moss-100 p-3 font-normal outline-none focus:border-moss-600" /></label>
          <label className="text-sm font-bold text-ink">Cách liên hệ phù hợp <span className="font-normal text-slate-500">(không bắt buộc)</span><input value={contactPreference} onChange={(event) => setContactPreference(event.target.value)} maxLength={120} placeholder="Ví dụ: gặp trực tiếp ở trường" className="mt-2 w-full rounded-xl border border-moss-100 p-3 font-normal outline-none focus:border-moss-600" /></label>
        </div>
        <label className="mt-4 block text-sm font-bold text-ink">Chủ đề<select value={topic} onChange={(event) => setTopic(event.target.value as SupportTopic)} className="mt-2 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal outline-none focus:border-moss-600">{topicShortcuts.map((item) => <option value={item.topic} key={item.topic}>{item.label}</option>)}</select></label>
        <label className="mt-4 block text-sm font-bold text-ink">Điều bạn muốn người hỗ trợ biết <span className="font-normal text-slate-500">(không bắt buộc)</span><textarea value={studentNote} onChange={(event) => setStudentNote(event.target.value)} maxLength={700} rows={4} className="mt-2 w-full rounded-xl border border-moss-100 p-3 font-normal outline-none focus:border-moss-600" placeholder="Chỉ viết điều bạn thấy cần thiết; không ghi mật khẩu, OTP hay thông tin tài chính." /></label>
        <label className="mt-5 flex gap-3 rounded-xl bg-moss-50 p-4 text-sm leading-6 text-slate-700"><input type="checkbox" className="mt-1 size-4" checked={consent} onChange={(event) => setConsent(event.target.checked)} />Mình hiểu thông tin trên sẽ được gửi tới nhân sự hỗ trợ được nhà trường phân quyền để liên hệ và hỗ trợ mình.</label>
        <button disabled={!consent || status === 'sending'} className="button-primary mt-5">{status === 'sending' ? 'Đang gửi…' : 'Gửi yêu cầu hỗ trợ'}</button>
        {status === 'error' ? <p role="alert" className="mt-3 text-sm text-[#9d403f]">{error}</p> : null}
      </>}
    </form>
  );
}
