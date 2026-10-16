import Link from 'next/link';
import type { Contact } from '@/lib/types';

export function SupportPanel({ emergency = false, contacts = [] }: { emergency?: boolean; contacts?: Contact[] }) {
  return (
    <aside className={`rounded-3xl border p-5 ${emergency ? 'border-[#eab8b2] bg-[#fff7f5]' : 'border-moss-100 bg-moss-50'}`} aria-live={emergency ? 'assertive' : 'polite'}>
      <h2 className="text-lg font-bold text-ink">{emergency ? 'Điều quan trọng nhất lúc này là an toàn' : 'Kết nối với người hỗ trợ'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {emergency
          ? 'Đừng ở một mình. Hãy tìm ngay thầy cô, người thân hoặc một người lớn đáng tin cậy đang ở gần bạn.'
          : 'Bạn không nhất thiết phải tự giải quyết mọi chuyện một mình. Bạn có thể chọn người khiến bạn thấy an tâm để bắt đầu.'}
      </p>
      {contacts.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {contacts.map((contact) => (
            <li key={`${contact.label}-${contact.name || contact.phone}`} className="rounded-xl bg-white p-3">
              <strong>{contact.label}</strong>{contact.name ? `: ${contact.name}` : ''}
              {contact.location ? <span className="block">{contact.location}</span> : null}
              {contact.phone ? <a className="block underline" href={`tel:${contact.phone}`}>{contact.phone}</a> : null}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/help" className={emergency ? 'button-danger text-sm' : 'button-primary text-sm'}>Xem hỗ trợ của nhà trường</Link>
        {emergency ? <Link href="/help#urgent" className="button-secondary text-sm">Hỗ trợ khẩn cấp tại địa phương</Link> : null}
      </div>
    </aside>
  );
}
