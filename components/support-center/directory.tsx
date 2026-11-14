'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { SupportRequestForm } from './request-form';
import { SupportRequestManagement } from './request-management';
import type { PublicSupportContact } from '@/lib/db/school-support';
import { formatVietnamesePhone } from '@/lib/school/phone';

const topicNames: Record<string, string> = {
  study_pressure:'Áp lực học tập', exams:'Kiểm tra và thi cử', low_grades:'Điểm số', motivation:'Động lực học tập',
  friends:'Quan hệ bạn bè', bullying:'Bắt nạt học đường', family_conflict:'Khó khăn gia đình', communication:'Giao tiếp',
  anxiety_stress:'Căng thẳng', emotion_regulation:'Cảm xúc', other:'Vấn đề học đường khác',
};
const modeNames: Record<string,string> = { phone:'Gọi điện / đề nghị gọi lại', message:'Gửi yêu cầu qua MẦM', in_person:'Gặp trực tiếp' };
const intakeNames: Record<string,string> = { accepting:'Đang tiếp nhận', limited:'Tiếp nhận có giới hạn', not_accepting:'Chưa nhận yêu cầu' };
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase(); }

export function SupportDirectory() {
  const [contacts, setContacts] = useState<PublicSupportContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [intakeFilter, setIntakeFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/school-support', { cache: 'no-store' }).then(async (response) => {
      const body = await response.json() as { contacts?: PublicSupportContact[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Chưa thể tải danh bạ.');
      if (active) setContacts(body.contacts || []);
    }).catch((fetchError: unknown) => { if (active) setError(fetchError instanceof Error ? fetchError.message : 'Chưa thể tải danh bạ.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => contacts.filter((contact) => {
    const haystack = normalize([contact.fullName, contact.roleTitle, contact.department, contact.description, ...contact.supportTopics, ...contact.contactModes].join(' '));
    return (!search || haystack.includes(normalize(search))) && (!topicFilter || contact.supportTopics.includes(topicFilter)) &&
      (!modeFilter || contact.contactModes.includes(modeFilter as never)) && (!intakeFilter || contact.intakeStatus === intakeFilter);
  }), [contacts, search, topicFilter, modeFilter, intakeFilter]);

  async function copyPhone(contact: PublicSupportContact) {
    if (!contact.phoneE164) return;
    try { await navigator.clipboard.writeText(contact.phoneE164); setCopiedId(contact.id); window.setTimeout(() => setCopiedId(null), 1800); }
    catch { setError('Trình duyệt không cho phép sao chép. Bạn có thể chọn và sao chép số hiển thị.'); }
  }

  return <div className="mt-8">
    <SupportRequestManagement />
    <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-semibold lg:col-span-2">Tìm theo tên, vai trò, bộ phận hoặc chủ đề<input value={search} onChange={(e) => setSearch(e.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Nhập nội dung cần tìm…" /></label>
      <label className="text-sm font-semibold">Chủ đề hỗ trợ<select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="">Tất cả chủ đề</option>{Object.entries(topicNames).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold">Hình thức<select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="">Tất cả hình thức</option>{Object.entries(modeNames).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold">Tiếp nhận<select value={intakeFilter} onChange={(e) => setIntakeFilter(e.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="">Tất cả trạng thái</option><option value="accepting">Đang tiếp nhận</option><option value="limited">Có giới hạn</option><option value="not_accepting">Chưa tiếp nhận</option></select></label>
    </div>
    {loading ? <p className="mt-8 text-slate-600">Đang tải danh bạ đã xác minh…</p> : null}
    {error ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900" role="status">{error} Hồ sơ liên hệ chỉ được hiển thị sau khi nhà trường xác minh.</div> : null}
    {!loading && filtered.length === 0 ? <div className="card mt-6 p-7"><h2 className="text-lg font-bold text-ink">Chưa có hồ sơ phù hợp</h2><p className="mt-2 leading-7 text-slate-600">Danh bạ chỉ hiển thị nhân sự đã được nhà trường xác minh và cho phép công khai thông tin. Không có số điện thoại hoặc danh tính mẫu giả lập.</p><p className="mt-2 text-sm text-slate-600">Bạn có thể trao đổi trực tiếp với giáo viên chủ nhiệm hoặc người lớn đáng tin cậy tại trường.</p></div> : null}
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {filtered.map((contact) => <article key={contact.id} className="card p-5">
        <div className="flex gap-4">
          {contact.avatarUrl ? <Image src={contact.avatarUrl} alt={`Ảnh đại diện ${contact.fullName}`} width={64} height={64} unoptimized className="size-16 rounded-2xl object-cover" /> : <div aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-moss-100 text-2xl">🌱</div>}
          <div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-ink">{contact.fullName}</h2><p className="mt-1 text-sm font-semibold text-moss-700">{contact.roleTitle}</p><p className="text-xs text-slate-500">{contact.department}</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${contact.intakeStatus === 'accepting' ? 'bg-moss-100 text-moss-700' : 'bg-slate-100 text-slate-700'}`}>{intakeNames[contact.intakeStatus]}</span></div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">{contact.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">{contact.supportTopics.map((topic) => <span key={topic} className="rounded-full bg-[#f6f5ef] px-3 py-1 text-xs text-slate-700">{topicNames[topic] || topic}</span>)}</div>
        <div className="mt-4 space-y-1 text-sm text-slate-700"><p><strong>Thời gian:</strong> {contact.contactHours || 'Theo lịch được nhân sự xác nhận'}</p><p><strong>Hình thức:</strong> {contact.contactModes.map((mode) => mode === 'phone' && !contact.phoneE164 ? 'Đề nghị gọi lại' : modeNames[mode] || mode).join(', ')}</p><p className="text-xs text-slate-500">Xác minh gần nhất: {new Date(contact.lastVerifiedAt).toLocaleDateString('vi-VN')}</p></div>
        {contact.phoneE164 ? <div className="mt-4 rounded-xl bg-moss-50 p-3"><p className="text-xs font-semibold text-slate-600">Số điện thoại liên hệ đã được cho phép công khai</p><p className="mt-1 select-all text-lg font-bold tracking-wide text-ink">{formatVietnamesePhone(contact.phoneE164)}</p><div className="mt-3 flex flex-wrap gap-2"><a className="button-primary" href={`tel:${contact.phoneE164}`}>Gọi điện</a><button type="button" className="button-secondary" onClick={() => copyPhone(contact)}>{copiedId === contact.id ? 'Đã sao chép' : 'Sao chép số'}</button></div><p className="mt-2 text-xs leading-5 text-slate-500">Thiết bị có thể mở ứng dụng gọi điện. Cuộc gọi chỉ bắt đầu khi bạn tự xác nhận trong ứng dụng gọi.</p></div> : <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">Hồ sơ này không công khai số điện thoại. Hãy sử dụng hình thức liên hệ đã được liệt kê.</p>}
        {contact.email ? <a href={`mailto:${contact.email}`} className="mt-3 block break-all text-sm font-semibold text-moss-700 underline">{contact.email}</a> : null}
        {contact.intakeNote ? <p className="mt-2 text-xs leading-5 text-slate-600">{contact.intakeNote}</p> : null}
        <button type="button" disabled={contact.intakeStatus === 'not_accepting'} onClick={() => setSelectedId(selectedId === contact.id ? null : contact.id)} className="button-secondary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50">{selectedId === contact.id ? 'Đóng biểu mẫu' : 'Gửi yêu cầu tư vấn / đặt lịch'}</button>
        {selectedId === contact.id ? <SupportRequestForm contact={contact} onClose={() => setSelectedId(null)} /> : null}
      </article>)}
    </div>
  </div>;
}
