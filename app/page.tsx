import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-12 animate-fadeIn">
      {/* HERO SECTION TRÊN CÙNG */}
      <section className="grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#5a824d]">
            AI ĐỒNG HÀNH HỌC ĐƯỜNG
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2c4a24] leading-tight">
            Có những chuyện khó nói. <span className="text-[#3a5a30]">MẦM</span> sẽ cùng bạn bắt đầu.
          </h1>
          <p className="text-sm sm:text-base leading-7 text-slate-600 max-w-2xl mx-auto lg:mx-0">
            Một nơi để bạn nói về áp lực học tập, bạn bè, gia đình, cảm xúc và những chuyện khó xử — rồi cùng tìm một bước nhỏ, phù hợp hơn.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2d4a22] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#1f3617] hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              🌱 Trò chuyện cùng MẦM
            </Link>
            <Link
              href="/handoff"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#f2cecb] bg-[#fff7f5] px-6 py-3.5 text-sm font-bold text-[#9e4a4a] transition-all hover:bg-[#fcefee]"
            >
              🆘 Mình cần được giúp ngay
            </Link>
          </div>
          <p className="text-xs text-slate-400 pt-1">
            MẦM là công cụ AI hỗ trợ bước đầu, không chẩn đoán và không thay thế thầy cô, gia đình hay chuyên gia.
          </p>
        </div>

        {/* THẺ PREVIEW BÊN PHẢI */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-[#e2ebd8] bg-[#f4f8f3] p-6 shadow-xs space-y-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#e4efdf] text-2xl">🌱</div>
            <h2 className="text-lg font-bold text-[#2c4a24]">“Mình đang gặp một chuyện…”</h2>
            <p className="text-xs leading-6 text-slate-600">
              Bạn không cần phải nói thật hoàn hảo. MẦM sẽ lắng nghe trước, hỏi điều cần thiết và cùng bạn chọn hướng phù hợp.
            </p>
            <div className="rounded-2xl bg-white p-4 text-xs leading-6 text-slate-500 border border-[#e2ebd8]">
              <strong>Trước khi bắt đầu:</strong> Bạn không cần cho MẦM biết tên thật. Đừng chia sẻ mật khẩu, mã OTP, thông tin tài chính hay thông tin riêng tư không cần thiết.
            </div>
          </div>
        </div>
      </section>

      {/* KHỐI TÍNH NĂNG NỔI BẬT (3 CỘT) */}
      <section className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-3xl border border-[#e2ebd8] bg-white p-6 shadow-xs">
          <span className="text-2xl mb-3 block">👂</span>
          <h3 className="font-bold text-[#2c4a24] text-base mb-2">Lắng nghe, không phán xét</h3>
          <p className="text-xs leading-6 text-slate-600">
            Bạn được quyền có những cảm xúc phức tạp. MẦM không gán nhãn hay trách bạn.
          </p>
        </div>

        <div className="rounded-3xl border border-[#e2ebd8] bg-white p-6 shadow-xs">
          <span className="text-2xl mb-3 block">🧭</span>
          <h3 className="font-bold text-[#2c4a24] text-base mb-2">Tìm một bước nhỏ</h3>
          <p className="text-xs leading-6 text-slate-600">
            Thay vì đưa quá nhiều lời khuyên, MẦM cùng bạn chọn điều có thể thử ngay hôm nay.
          </p>
        </div>

        <div className="rounded-3xl border border-[#e2ebd8] bg-white p-6 shadow-xs">
          <span className="text-2xl mb-3 block">🤝</span>
          <h3 className="font-bold text-[#2c4a24] text-base mb-2">Kết nối người thật khi cần</h3>
          <p className="text-xs leading-6 text-slate-600">
            Khi chuyện trở nên nặng nề hoặc không an toàn, sự có mặt của một người lớn đáng tin cậy là quan trọng nhất.
          </p>
        </div>
      </section>

      {/* BANNER KẾT NỐI VỚI NGƯỜI HỖ TRỢ */}
      <section className="rounded-3xl border border-[#e2ebd8] bg-[#f4f8f3] p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="font-bold text-[#2c4a24] text-lg">Kết nối với người hỗ trợ</h3>
          <p className="text-xs leading-6 text-slate-600 mt-1">
            Bạn không nhất thiết phải tự giải quyết mọi chuyện một mình. Bạn có thể chọn người khiến bạn thấy an tâm để bắt đầu.
          </p>
        </div>
        <Link
          href="/handoff"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2d4a22] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#1f3617]"
        >
          Xem hỗ trợ của nhà trường
        </Link>
      </section>
    </div>
  );
}