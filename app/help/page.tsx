import Link from 'next/link';
import { SupportPanel } from '@/components/safety/support-panel';
export const dynamic = 'force-dynamic';
export default function HelpPage() {
  return <div className="page-shell py-10 sm:py-14"><div className="mx-auto max-w-3xl">
    <p className="eyebrow">Tìm người hỗ trợ</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Bạn không cần tự gánh chuyện này một mình</h1>
    <p className="mt-3 leading-7 text-slate-700">MẦM có thể là nơi để bắt đầu. Khi cần thêm sự đồng hành, một người thật mà bạn tin tưởng có thể giúp bạn an toàn hơn và hiểu rõ hơn điều đang xảy ra.</p>
    <section id="urgent" className="mt-8 scroll-mt-6"><SupportPanel emergency /><div className="mt-4 rounded-2xl border border-[#eab8b2] bg-white p-5 text-sm leading-6 text-slate-700"><strong className="text-ink">Nếu nguy hiểm đang xảy ra ngay lúc này:</strong> hãy đi tới người lớn gần bạn nhất. Nếu bạn đang ở trường, hãy tìm trực tiếp thầy cô hoặc nhân viên nhà trường gần nhất. Khi cần trợ giúp khẩn cấp, hãy liên hệ dịch vụ khẩn cấp tại địa phương hoặc đến cơ sở y tế gần nhất.</div></section>
    <section className="card mt-7 p-6 sm:p-8"><h2 className="text-xl font-bold text-ink">Kết nối hỗ trợ học đường</h2><p className="mt-2 leading-7 text-slate-700">Danh bạ chỉ hiển thị hồ sơ được xác minh. Số điện thoại chỉ hiển thị khi nhà trường/giáo viên đã cho phép công khai. Bạn tự quyết định gọi hoặc gửi yêu cầu; MẦM không tự chia sẻ nội dung chat.</p><Link href="/support-center" className="button-primary mt-4">Mở danh bạ giáo viên và nhân sự</Link></section>
  </div></div>;
}
