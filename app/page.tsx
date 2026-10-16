import Link from 'next/link';
import { SupportPanel } from '@/components/safety/support-panel';
import { TopicShortcuts } from '@/components/topics';

export default function HomePage() {
  return (
    <>
      <section className="page-shell grid gap-10 py-12 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">AI đồng hành học đường</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">Có những chuyện khó nói. <span className="text-moss-600">MẦM</span> sẽ cùng bạn bắt đầu.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
            Một nơi để bạn nói về áp lực học tập, bạn bè, gia đình, cảm xúc và những chuyện khó xử — rồi cùng tìm một bước nhỏ, phù hợp hơn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/chat" className="button-primary">💬 Trò chuyện cùng MẦM</Link>
            <Link href="/help#urgent" className="button-secondary">🆘 Mình cần được giúp ngay</Link>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">MẦM là công cụ AI hỗ trợ bước đầu, không chẩn đoán và không thay thế thầy cô, gia đình hay chuyên gia.</p>
        </div>
        <div className="card relative overflow-hidden p-7 sm:p-9">
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-moss-100" aria-hidden="true" />
          <div className="relative">
            <span className="grid size-14 place-items-center rounded-2xl bg-moss-100 text-3xl">🌱</span>
            <p className="mt-7 text-xl font-bold leading-8 text-ink">“Mình đang gặp một chuyện…”</p>
            <p className="mt-3 leading-7 text-slate-700">Bạn không cần phải nói thật hoàn hảo. MẦM sẽ lắng nghe trước, hỏi điều cần thiết và cùng bạn chọn hướng phù hợp.</p>
            <div className="mt-6 rounded-2xl bg-[#fbfaf7] p-4 text-sm text-slate-700">
              <strong className="block text-ink">Trước khi bắt đầu</strong>
              Bạn không cần cho MẦM biết tên thật. Đừng chia sẻ mật khẩu, mã OTP, thông tin tài chính hay thông tin riêng tư không cần thiết.
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-12">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Bạn muốn nói về</p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink">Chọn một chủ đề, hoặc bắt đầu theo cách của bạn</h2>
          </div>
          <Link href="/chat" className="font-bold text-moss-700 underline">Viết điều mình đang nghĩ →</Link>
        </div>
        <TopicShortcuts />
      </section>

      <section className="page-shell grid gap-5 pb-4 lg:grid-cols-3">
        <article className="card p-6"><span className="text-2xl">👂</span><h2 className="mt-3 text-lg font-bold">Lắng nghe, không phán xét</h2><p className="mt-2 text-sm leading-6 text-slate-700">Bạn được quyền có những cảm xúc phức tạp. MẦM không gán nhãn hay trách bạn.</p></article>
        <article className="card p-6"><span className="text-2xl">🧭</span><h2 className="mt-3 text-lg font-bold">Tìm một bước nhỏ</h2><p className="mt-2 text-sm leading-6 text-slate-700">Thay vì đưa quá nhiều lời khuyên, MẦM cùng bạn chọn điều có thể thử ngay hôm nay.</p></article>
        <article className="card p-6"><span className="text-2xl">🤝</span><h2 className="mt-3 text-lg font-bold">Kết nối người thật khi cần</h2><p className="mt-2 text-sm leading-6 text-slate-700">Khi chuyện trở nên nặng nề hoặc không an toàn, sự có mặt của một người lớn đáng tin cậy là quan trọng nhất.</p></article>
      </section>

      <section className="page-shell pb-4"><SupportPanel /></section>
    </>
  );
}
