'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { PublicSupportContact } from '@/lib/db/school-support';

type Slot = { id: string; startsAt: string; endsAt: string; mode: string };
type RequestResult = { id: string; cancellationToken: string };

function todayLocalDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const topics = [
  ['study_pressure','Áp lực học tập'],['exams','Kiểm tra và thi cử'],['friends','Quan hệ bạn bè'],['bullying','Bắt nạt học đường'],
  ['family_conflict','Khó khăn gia đình'],['communication','Giao tiếp'],['anxiety_stress','Căng thẳng'],['other','Vấn đề khác'],
] as const;
const modes = [
  ['phone','Gọi điện'],['message','Gửi yêu cầu qua MẦM'],['in_person','Gặp trực tiếp'],
] as const;

export function SupportRequestForm({ contact, onClose }: { contact: PublicSupportContact; onClose: () => void }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('other');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'phone'|'message'|'in_person'>(contact.contactModes[0] || 'in_person');
  const [date, setDate] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<RequestResult | null>(null);
  const [manageDate, setManageDate] = useState('');
  const [manageWindow, setManageWindow] = useState('');
  const [manageMessage, setManageMessage] = useState('');
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/appointments/slots?contactId=${encodeURIComponent(contact.id)}`, { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ slots?: Slot[] }> : { slots: [] })
      .then((body) => { if (active) setSlots(body.slots || []); })
      .catch(() => { if (active) setSlots([]); });
    return () => { active = false; };
  }, [contact.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!consent) return;
    setStatus('loading'); setError('');
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id, slotId: selectedSlot || undefined, requesterName: name || undefined,
          requesterPhone: phone || undefined, requesterEmail: email || undefined, topic, note: note || undefined,
          preferredMode: mode, requestedDate: selectedSlot ? undefined : date || undefined,
          requestedTimeWindow: selectedSlot ? undefined : timeWindow || undefined, consent,
        }),
      });
      const body = await response.json() as RequestResult & { error?: string };
      if (!response.ok) throw new Error(body.error || 'Chưa thể gửi yêu cầu.');
      setResult(body); setStatus('success');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Chưa thể gửi yêu cầu.'); setStatus('error');
    }
  }

  if (status === 'success' && result) {
    async function cancelRequest() {
      if (!window.confirm('Bạn có chắc muốn hủy yêu cầu này?')) return;
      setManaging(true); setManageMessage('');
      try { const response = await fetch(`/api/appointments/${result!.id}/cancel`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ cancellationToken:result!.cancellationToken }) }); const body = await response.json() as {error?:string}; if(!response.ok) throw new Error(body.error || 'Không thể hủy.'); setManageMessage('Yêu cầu đã được hủy.'); }
      catch(error){setManageMessage(error instanceof Error?error.message:'Không thể hủy yêu cầu.');} finally {setManaging(false);}
    }
    async function rescheduleRequest(event: FormEvent) {
      event.preventDefault(); setManaging(true); setManageMessage('');
      try { const response = await fetch(`/api/appointments/${result!.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ cancellationToken:result!.cancellationToken, requestedDate:manageDate, requestedTimeWindow:manageWindow, preferredMode:mode }) }); const body = await response.json() as {error?:string}; if(!response.ok) throw new Error(body.error || 'Không thể đổi lịch.'); setManageMessage('Đã gửi yêu cầu đổi lịch; trạng thái trở về chờ xác nhận.'); }
      catch(error){setManageMessage(error instanceof Error?error.message:'Không thể đổi lịch.');} finally {setManaging(false);}
    }
    return <div className="rounded-2xl border border-moss-100 bg-moss-50 p-5" role="status">
      <h3 className="font-bold text-ink">Đã gửi yêu cầu — đang chờ xác nhận</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">Yêu cầu đã gửi tới {contact.fullName}. Người nhận cần xác nhận trước khi lịch được coi là đã đặt. MẦM không bảo đảm người nhận đang trực hoặc sẽ phản hồi ngay.</p>
      <div className="mt-3 rounded-xl bg-white p-3 text-xs"><p><strong>Mã yêu cầu:</strong> {result.id}</p><p className="mt-1 break-all"><strong>Mã quản lý riêng tư:</strong> {result.cancellationToken}</p><p className="mt-2 text-slate-500">Hãy lưu mã này. Mã cho phép hủy hoặc thay đổi yêu cầu; không chia sẻ cho người khác.</p></div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="button-secondary" onClick={async () => { try { await navigator.clipboard.writeText(`${result.id}\n${result.cancellationToken}`); setManageMessage('Đã sao chép mã quản lý.'); } catch { setManageMessage('Không thể sao chép tự động; hãy chọn và sao chép mã đang hiển thị.'); } }}>Sao chép mã</button><button type="button" className="button-danger" disabled={managing} onClick={() => void cancelRequest()}>Hủy yêu cầu</button><button type="button" className="button-secondary" onClick={onClose}>Đóng</button></div>
      <form onSubmit={rescheduleRequest} className="mt-4 rounded-xl bg-white p-4"><h4 className="font-semibold text-ink">Đề nghị đổi lịch</h4><p className="mt-1 text-xs text-slate-600">Đổi lịch sẽ chuyển yêu cầu về trạng thái chờ xác nhận. Đây không phải xác nhận lịch mới.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-xs font-semibold">Ngày mới<input required type="date" min={todayLocalDateValue()} value={manageDate} onChange={(e)=>setManageDate(e.target.value)} className="mt-1 w-full rounded-lg border border-moss-100 p-2"/></label><label className="text-xs font-semibold">Khung giờ mới<input required value={manageWindow} onChange={(e)=>setManageWindow(e.target.value)} className="mt-1 w-full rounded-lg border border-moss-100 p-2" placeholder="Ví dụ: sau 16:00"/></label></div><button disabled={managing} className="button-secondary mt-3">Gửi yêu cầu đổi lịch</button></form>
      {manageMessage?<p role="status" className="mt-3 text-sm text-slate-700">{manageMessage}</p>:null}
    </div>;
  }

  return <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-moss-100 bg-moss-50/70 p-4">
    <div><h3 className="font-bold text-ink">Gửi yêu cầu đến {contact.fullName}</h3><p className="mt-1 text-xs leading-5 text-slate-600">Yêu cầu sẽ đến hồ sơ nhân sự đã chọn và người quản trị được phân quyền xử lý hệ thống.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Tên/cách xưng hô <span className="font-normal text-slate-500">(không bắt buộc)</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
      <label className="text-sm font-semibold">Số điện thoại <span className="font-normal text-slate-500">(tự nguyện)</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} placeholder="Số bạn muốn được gọi lại" className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
    </div>
    <label className="block text-sm font-semibold">Email <span className="font-normal text-slate-500">(tự nguyện)</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
    <label className="block text-sm font-semibold">Chủ đề<select value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal">{topics.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="block text-sm font-semibold">Giới thiệu ngắn <span className="font-normal text-slate-500">(tùy chọn, tối đa 600 ký tự)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} rows={3} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Chỉ viết điều bạn đồng ý chia sẻ. Nội dung chat và nhật ký không được đính kèm." /></label>
    {slots.length > 0 ? <label className="block text-sm font-semibold">Khung giờ nhà trường đã mở<select value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="">Chưa chọn — gửi yêu cầu lịch thủ công</option>{slots.map((slot) => <option value={slot.id} key={slot.id}>{new Date(slot.startsAt).toLocaleString('vi-VN')} · {modes.find(([v]) => v === slot.mode)?.[1] || slot.mode}</option>)}</select></label> : <p className="rounded-xl bg-white p-3 text-sm leading-6 text-slate-600">Hiện chưa có khung giờ đã được nhân sự mở. Bạn có thể gửi ngày và khung giờ mong muốn để chờ xác nhận thủ công.</p>}
    {!selectedSlot ? <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Hình thức mong muốn<select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal">{modes.filter(([v]) => contact.contactModes.includes(v as typeof mode)).map(([v,label]) => <option key={v} value={v}>{v === 'phone' && !contact.phoneE164 ? 'Điện thoại (đề nghị gọi lại)' : label}</option>)}</select></label>
      <label className="text-sm font-semibold">Ngày mong muốn<input type="date" min={todayLocalDateValue()} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal" required /></label>
      <label className="text-sm font-semibold sm:col-span-2">Khung giờ mong muốn<input value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} maxLength={120} placeholder="Ví dụ: sau giờ học, khoảng 16:00–17:00" className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" required /></label>
    </div> : null}
    <div className="rounded-xl border border-moss-100 bg-white p-3 text-xs leading-5 text-slate-600">
      <strong className="text-ink">Trước khi gửi, hãy đọc thông tin chia sẻ:</strong>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        <li>Người nhận: {contact.fullName} ({contact.roleTitle}); quản trị viên có quyền vận hành cũng có thể xử lý yêu cầu.</li>
        <li>Dữ liệu gửi: tên/cách xưng hô, thông tin liên hệ bạn nhập, chủ đề, nội dung giới thiệu và lịch mong muốn.</li>
        <li>Mục đích: liên hệ và sắp xếp hỗ trợ học đường. Nội dung trò chuyện AI, check-in và nhật ký không được gửi.</li>
        <li>Dữ liệu liên hệ và nội dung giới thiệu được mã hóa trong cơ sở dữ liệu; dự kiến xóa sau 90 ngày kể từ khi yêu cầu đóng, khi nhà trường cấu hình tác vụ xóa định kỳ.</li>
        <li>Bạn có thể rút yêu cầu bằng mã hủy sau khi gửi hoặc liên hệ nhà trường để yêu cầu xóa dữ liệu.</li>
      </ul>
    </div>
    <label className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm leading-6"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4" />Mình đã đọc và đồng ý gửi những thông tin mình tự nhập cho mục đích nêu trên.</label>
    <div className="flex flex-wrap gap-2"><button disabled={!consent || status === 'loading'} className="button-primary" type="submit">{status === 'loading' ? 'Đang gửi…' : 'Gửi yêu cầu'}</button><button type="button" className="button-secondary" onClick={onClose}>Hủy</button></div>
    {status === 'error' ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
  </form>;
}
