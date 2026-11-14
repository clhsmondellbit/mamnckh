'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { SupportContact } from '@/lib/db/school-support';

type ContactForm = {
  fullName: string; roleTitle: string; department: string; supportTopics: string; description: string;
  phone: string; email: string; contactHours: string; contactModes: string[]; intakeStatus: 'accepting'|'limited'|'not_accepting'; intakeNote: string;
};
const emptyForm: ContactForm = { fullName:'', roleTitle:'', department:'', supportTopics:'', description:'', phone:'', email:'', contactHours:'', contactModes:['in_person'], intakeStatus:'not_accepting', intakeNote:'' };
const modeOptions = [['phone','Gọi điện'],['message','Nhắn tin'],['in_person','Gặp trực tiếp']];
const topicOptions = ['study_pressure','exams','friends','bullying','family_conflict','communication','anxiety_stress','other'];

export function ContactManager() {
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [consentByContact, setConsentByContact] = useState<Record<string, { avatar: boolean; phone: boolean; email: boolean }>>({});
  const [verificationMethodByContact, setVerificationMethodByContact] = useState<Record<string, 'school_confirmation'|'direct_staff_confirmation'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch('/api/staff/contacts', { cache:'no-store' }); const body = await response.json() as {contacts?:SupportContact[];error?:string}; if (!response.ok) throw new Error(body.error); setContacts(body.contacts || []); setMessage(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể tải danh bạ.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function beginEdit(contact: SupportContact) {
    setEditingId(contact.id);
    setConsentByContact((current) => ({ ...current, [contact.id]: { avatar: false, phone: false, email: false } }));
    setForm({ fullName:contact.fullName, roleTitle:contact.roleTitle, department:contact.department, supportTopics:contact.supportTopics.join(', '), description:contact.description, phone:contact.phoneE164 || '', email:contact.email || '', contactHours:contact.contactHours, contactModes:contact.contactModes, intakeStatus:contact.intakeStatus, intakeNote:contact.intakeNote });
    setVerificationMethodByContact((current) => ({ ...current, [contact.id]: 'school_confirmation' }));
  }
  function reset() { setEditingId(null); setForm(emptyForm); setVerificationMethodByContact({}); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage('');
    const payload = { ...form, supportTopics: form.supportTopics.split(',').map((value) => value.trim()).filter(Boolean) };
    try {
      const response = await fetch(editingId ? `/api/staff/contacts/${editingId}` : '/api/staff/contacts', { method:editingId?'PATCH':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const body = await response.json() as {error?:string}; if (!response.ok) throw new Error(body.error || 'Không thể lưu hồ sơ.');
      if (editingId) setConsentByContact((current) => ({ ...current, [editingId]: { avatar: false, phone: false, email: false } }));
      setMessage(editingId ? 'Đã cập nhật. Hồ sơ chuyển về trạng thái chưa xác minh và sẽ ẩn khỏi danh bạ công khai.' : 'Đã tạo hồ sơ ở trạng thái nháp, chưa công khai.'); reset(); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể lưu hồ sơ.'); }
    finally { setSaving(false); }
  }

  async function verify(contact: SupportContact) {
    const confirmMessage = `Xác minh hồ sơ ${contact.fullName}? Chỉ tiếp tục khi bạn đã xác nhận danh tính/vai trò với nhà trường. Số điện thoại và email chỉ công khai khi các ô đồng ý bên dưới được chọn.`;
    if (!window.confirm(confirmMessage)) return;
    try {
      const response = await fetch(`/api/staff/contacts/${contact.id}/verify`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ verificationMethod: verificationMethodByContact[contact.id] || 'school_confirmation', avatarConsentConfirmed:consentByContact[contact.id]?.avatar || false, phoneConsentConfirmed:consentByContact[contact.id]?.phone || false, emailConsentConfirmed:consentByContact[contact.id]?.email || false }) });
      const body = await response.json() as {error?:string}; if (!response.ok) throw new Error(body.error || 'Xác minh thất bại.');
      setMessage('Đã xác minh hồ sơ. Thông tin liên hệ chỉ được công khai theo lựa chọn đồng ý.'); setConsentByContact((current) => ({ ...current, [contact.id]: { avatar: false, phone: false, email: false } })); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Xác minh thất bại.'); }
  }

  async function deactivate(contact: SupportContact) {
    if (!window.confirm(`Ngừng công khai hồ sơ ${contact.fullName}? Số điện thoại và email sẽ được ẩn ngay.`)) return;
    try { const response = await fetch(`/api/staff/contacts/${contact.id}`, {method:'DELETE'}); const body = await response.json() as {error?:string}; if (!response.ok) throw new Error(body.error); await load(); setMessage('Đã ngừng công khai hồ sơ.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể ngừng công khai.'); }
  }

  async function reactivate(contact: SupportContact) {
    if (!window.confirm(`Kích hoạt lại hồ sơ ${contact.fullName} ở trạng thái chưa xác minh? Số điện thoại/email vẫn sẽ ẩn cho đến khi xác minh lại.`)) return;
    try {
      const response = await fetch(`/api/staff/contacts/${contact.id}`, { method:'POST' });
      const body = await response.json() as {error?:string};
      if (!response.ok) throw new Error(body.error || 'Không thể kích hoạt hồ sơ.');
      setConsentByContact((current) => ({ ...current, [contact.id]: { avatar: false, phone: false, email: false } }));
      setMessage('Hồ sơ đã kích hoạt ở trạng thái chưa xác minh; hãy xác minh và ghi nhận consent trước khi công khai.');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể kích hoạt hồ sơ.'); }
  }

  return <section className="space-y-6">
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-ink">{editingId ? 'Chỉnh sửa hồ sơ liên hệ' : 'Thêm nhân sự hỗ trợ'}</h2><p className="mt-1 text-sm leading-6 text-slate-600">Thông tin mới luôn ở trạng thái chưa xác minh. Mọi thay đổi hồ sơ đều tự ẩn số điện thoại/email cho đến khi xác minh lại.</p></div>{editingId ? <button type="button" className="button-secondary" onClick={reset}>Bỏ chỉnh sửa</button> : null}</div>
      <p role="note" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">Chỉ nhập họ tên, chức vụ, bộ phận và chủ đề hỗ trợ theo thông tin do nhà trường hoặc chính nhân sự xác nhận. Không tự suy diễn hay gán chức danh chuyên viên/chuyên gia tâm lý cho giáo viên khi chưa có căn cứ về chuyên môn. Hồ sơ mới luôn ở trạng thái nháp, chưa được hiển thị công khai.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Họ và tên<input required maxLength={120} value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
        <label className="text-sm font-semibold">Vai trò/chức vụ<input required maxLength={120} value={form.roleTitle} onChange={(e)=>setForm({...form,roleTitle:e.target.value})} placeholder="Ví dụ: Giáo viên chủ nhiệm" className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
        <label className="text-sm font-semibold">Bộ phận phụ trách<input required maxLength={120} value={form.department} onChange={(e)=>setForm({...form,department:e.target.value})} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
        <label className="text-sm font-semibold">Số điện thoại (nếu được phép)<input type="tel" maxLength={40} value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="Số do trường/giáo viên cung cấp" className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
        <label className="text-sm font-semibold">Email công việc<input type="email" maxLength={254} value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
        <label className="text-sm font-semibold">Thời gian tiếp nhận<input maxLength={200} value={form.contactHours} onChange={(e)=>setForm({...form,contactHours:e.target.value})} placeholder="Theo lịch nhà trường xác nhận" className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
      </div>
      <label className="mt-3 block text-sm font-semibold">Chủ đề có thể hỗ trợ (mã chủ đề, phân cách bằng dấu phẩy)<input value={form.supportTopics} onChange={(e)=>setForm({...form,supportTopics:e.target.value})} placeholder={topicOptions.join(', ')} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
      <label className="mt-3 block text-sm font-semibold">Mô tả ngắn<textarea rows={2} maxLength={500} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <fieldset className="rounded-xl border border-moss-100 p-3"><legend className="px-1 text-sm font-semibold">Hình thức hỗ trợ</legend><div className="mt-2 flex flex-wrap gap-3">{modeOptions.map(([value,label])=><label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.contactModes.includes(value)} onChange={(e)=>setForm({...form,contactModes:e.target.checked?[...form.contactModes,value]:form.contactModes.filter((v)=>v!==value)})}/>{label}</label>)}</div></fieldset>
        <label className="text-sm font-semibold">Trạng thái tiếp nhận<select value={form.intakeStatus} onChange={(e)=>setForm({...form,intakeStatus:e.target.value as ContactForm['intakeStatus']})} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="accepting">Đang tiếp nhận</option><option value="limited">Tiếp nhận có giới hạn</option><option value="not_accepting">Chưa tiếp nhận</option></select></label>
      </div>
      <label className="mt-3 block text-sm font-semibold">Ghi chú tiếp nhận<textarea rows={2} maxLength={200} value={form.intakeNote} onChange={(e)=>setForm({...form,intakeNote:e.target.value})} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" /></label>
      <button disabled={saving || form.contactModes.length===0} className="button-primary mt-4">{saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Tạo hồ sơ nháp'}</button>
    </form>

    {message ? <p role="status" className="rounded-xl bg-moss-50 p-3 text-sm text-ink">{message}</p> : null}
    <section className="space-y-3"><h2 className="text-xl font-bold text-ink">Danh bạ và trạng thái xác minh</h2>{loading ? <p>Đang tải…</p> : contacts.length===0 ? <p className="card p-5 text-sm text-slate-600">Chưa có hồ sơ. Thêm dữ liệu do nhà trường xác nhận; không nhập thông tin giả.</p> : contacts.map((contact)=><article key={contact.id} className="card p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-ink">{contact.fullName}</h3><p className="text-sm text-slate-600">{contact.roleTitle} · {contact.department}</p><p className="mt-1 text-xs text-slate-500">{contact.isActive?'Đang hoạt động':'Đã ngừng công khai'} · {contact.isVerified?`Đã xác minh (${contact.lastVerifiedAt?new Date(contact.lastVerifiedAt).toLocaleDateString('vi-VN'):'—'})`:'Chưa xác minh'}</p><p className="mt-1 text-xs text-slate-600">SĐT: {contact.phoneE164 || 'Chưa nhập'} · Công khai: {contact.phoneIsPublic?'Có':'Không'}</p></div><div className="flex flex-wrap gap-2"><button type="button" className="button-secondary" onClick={()=>beginEdit(contact)}>Chỉnh sửa</button>{contact.isActive?<button type="button" className="button-danger" onClick={()=>deactivate(contact)}>Ngừng công khai</button>:<button type="button" className="button-secondary" onClick={()=>void reactivate(contact)}>Kích hoạt lại (ẩn)</button>}</div></div>
      {!contact.isVerified && contact.isActive ? <div className="mt-4 rounded-xl bg-amber-50 p-3"><p className="text-sm font-semibold">Xác minh — chỉ chọn sau khi đã có xác nhận thực tế</p><label className="mt-2 block text-xs font-semibold">Nguồn xác nhận<select value={verificationMethodByContact[contact.id] || 'school_confirmation'} onChange={(e)=>setVerificationMethodByContact((current)=>({...current,[contact.id]:e.target.value as 'school_confirmation'|'direct_staff_confirmation'}))} className="mt-1 rounded-lg border border-moss-100 bg-white p-2"><option value="school_confirmation">Nhà trường xác nhận</option><option value="direct_staff_confirmation">Nhân sự trực tiếp xác nhận</option></select></label><div className="mt-2 flex flex-wrap gap-4"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={consentByContact[contact.id]?.avatar || false} onChange={(e)=>setConsentByContact((current)=>({...current,[contact.id]:{avatar:e.target.checked,phone:current[contact.id]?.phone || false,email:current[contact.id]?.email || false}}))} disabled={!contact.avatarUrl}/> Cho phép công khai ảnh đại diện</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={consentByContact[contact.id]?.phone || false} onChange={(e)=>setConsentByContact((current)=>({...current,[contact.id]:{avatar:current[contact.id]?.avatar || false,phone:e.target.checked,email:current[contact.id]?.email || false}}))} disabled={!contact.phoneE164}/> Cho phép công khai số điện thoại</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={consentByContact[contact.id]?.email || false} onChange={(e)=>setConsentByContact((current)=>({...current,[contact.id]:{avatar:current[contact.id]?.avatar || false,phone:current[contact.id]?.phone || false,email:e.target.checked}}))} disabled={!contact.email}/> Cho phép công khai email công việc</label></div><button type="button" onClick={()=>void verify(contact)} className="button-primary mt-3">Xác nhận hồ sơ đã kiểm chứng</button></div>:null}
    </article>)}</section>
  </section>;
}
