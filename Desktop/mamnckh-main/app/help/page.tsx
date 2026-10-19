import { HandoffForm } from '@/components/handoff-form';
import { SupportPanel } from '@/components/safety/support-panel';
import { configuredContacts, schoolSupportConfig } from '@/lib/school/config';

export const dynamic = 'force-dynamic';

export default function HelpPage() {
  const contacts = configuredContacts();
  const handoffEnabled = process.env.ENABLE_STAFF_DASHBOARD === 'true' && Boolean(process.env.DATABASE_URL);

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Tìm người hỗ trợ</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">Bạn không cần tự gánh chuyện này một mình</h1>
        <p className="mt-3 leading-7 text-slate-700">MẦM có thể là nơi để bắt đầu. Khi cần thêm sự đồng hành, một người thật mà bạn tin tưởng có thể giúp bạn an toàn hơn và hiểu rõ hơn điều đang xảy ra.</p>

        <section id="urgent" className="mt-8 scroll-mt-6">
          <SupportPanel emergency contacts={contacts} />
          <div className="mt-4 rounded-2xl border border-[#eab8b2] bg-white p-5 text-sm leading-6 text-slate-700">
            <strong className="text-ink">Nếu nguy hiểm đang xảy ra ngay lúc này:</strong> hãy đi tới người lớn gần bạn nhất. Nếu bạn đang ở trường, hãy tìm trực tiếp thầy cô hoặc nhân viên nhà trường gần nhất. Khi cần trợ giúp khẩn cấp, hãy liên hệ dịch vụ khẩn cấp tại địa phương hoặc đến cơ sở y tế gần nhất.
          </div>
        </section>

        <section className="card mt-7 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">Thông tin hỗ trợ của trường</h2>
          {contacts.length > 0 ? <ul className="mt-4 space-y-3">{contacts.map((contact) => <li key={`${contact.label}-${contact.name || contact.phone}`} className="rounded-xl bg-moss-50 p-4"><strong>{contact.label}</strong>{contact.name ? <span> — {contact.name}</span> : null}{contact.location ? <span className="block text-sm">{contact.location}</span> : null}{contact.phone ? <a className="mt-1 block text-sm font-semibold text-moss-700 underline" href={`tel:${contact.phone}`}>{contact.phone}</a> : null}{contact.email ? <a className="mt-1 block text-sm font-semibold text-moss-700 underline" href={`mailto:${contact.email}`}>{contact.email}</a> : null}</li>)}</ul> : <p className="mt-3 rounded-xl bg-moss-50 p-4 leading-7 text-slate-700">Nhà trường chưa công bố thông tin liên hệ đã xác minh trên MẦM. Hãy tìm trực tiếp GVCN, một giáo viên bạn tin tưởng, phụ huynh/người chăm sóc hoặc bộ phận nhà trường gần bạn.</p>}
          {schoolSupportConfig.lastVerifiedAt ? <p className="mt-4 text-xs text-slate-500">Thông tin được xác minh lần cuối: {schoolSupportConfig.lastVerifiedAt}</p> : null}
        </section>

        <section id="request" className="mt-7 scroll-mt-6">
          <HandoffForm enabled={handoffEnabled} />
        </section>
      </div>
    </div>
  );
}
