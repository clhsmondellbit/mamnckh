import Link from 'next/link';
import { resources } from '@/lib/resources/data';

export default function ResourcesPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="max-w-2xl"><p className="eyebrow">Góc hỗ trợ</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Một vài điều có thể giúp bạn bắt đầu</h1><p className="mt-3 leading-7 text-slate-700">Những gợi ý này không thay thế sự giúp đỡ trực tiếp. Hãy chọn điều phù hợp với hoàn cảnh của bạn.</p></div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {resources.map((resource) => <article key={resource.id} className={`card p-6 ${resource.isEmergency ? 'border-[#eab8b2] bg-[#fff7f5]' : ''}`}><p className="text-xs font-bold uppercase tracking-[.15em] text-moss-700">{resource.isEmergency ? 'An toàn khẩn cấp' : resource.topic.replaceAll('_', ' ')}</p><h2 className="mt-2 text-xl font-bold text-ink">{resource.title}</h2><p className="mt-3 leading-7 text-slate-700">{resource.content}</p>{resource.isEmergency ? <Link href="/help#urgent" className="button-danger mt-5 text-sm">Tìm giúp đỡ ngay</Link> : <Link href={`/chat?topic=${resource.topic}`} className="mt-4 inline-block font-bold text-moss-700 underline">Nói với MẦM về chuyện này →</Link>}</article>)}
      </div>
    </div>
  );
}
