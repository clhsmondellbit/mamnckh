import Link from 'next/link';

// Giữ lại biến topicShortcuts để các component khác (như chat, handoff form) import không bị lỗi
export const topicShortcuts = [
  { icon: '📚', label: 'Học tập / thi cử', topic: 'study_pressure' },
  { icon: '👥', label: 'Bạn bè / lớp học', topic: 'friends' },
  { icon: '🏠', label: 'Gia đình', topic: 'family_conflict' },
  { icon: '❤️', label: 'Tình cảm', topic: 'relationships' },
  { icon: '😔', label: 'Cảm xúc', topic: 'sadness' },
  { icon: '📱', label: 'Mạng xã hội', topic: 'social_media' },
  { icon: '🌱', label: 'Phát triển bản thân', topic: 'self_confidence' },
  { icon: '💬', label: 'Chuyện khác', topic: 'other' },
] as const;

export function TopicShortcuts() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {topicShortcuts.map((topic) => (
        <Link
          key={topic.topic}
          href={`/chat?topic=${topic.topic}`}
          className="group flex min-h-24 items-center gap-3 rounded-2xl border border-[#d5e5cf] bg-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#82a875] hover:shadow-md"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e4efdf] text-xl" aria-hidden="true">
            {topic.icon}
          </span>
          <span className="font-bold text-[#2c4a24] group-hover:text-[#2d4a22]">{topic.label}</span>
        </Link>
      ))}
    </div>
  );
}

export const helpTopics = [
  {
    topic: 'study_pressure',
    tag: 'STUDY PRESSURE',
    icon: '📚',
    title: 'Khi việc học đang làm bạn ngợp',
    description:
      'Thử viết ra một việc học nhỏ nhất bạn có thể làm trong 10–15 phút. Sau đó nghỉ ngắn và xem điều gì vẫn còn khó. Điểm số không quyết định toàn bộ giá trị của bạn; nếu áp lực kéo dài, hãy nói với một người lớn bạn tin tưởng.',
    cta: 'Nói với MẦM về chuyện này',
    badgeBg: 'bg-[#e4efdf]',
    badgeColor: 'text-[#2d4a22]',
  },
  {
    topic: 'friends',
    tag: 'FRIENDS',
    icon: '👥',
    title: 'Khi có mâu thuẫn với bạn bè',
    description:
      'Bạn có thể thử nói theo mẫu: "Khi chuyện này xảy ra, mình cảm thấy... Mình mong...". Không cần phải giải quyết mọi chuyện ngay. Nếu có đe dọa, bắt nạt hoặc bạn không cảm thấy an toàn, hãy báo một người lớn trong trường.',
    cta: 'Nói với MẦM về chuyện này',
    badgeBg: 'bg-[#e4efdf]',
    badgeColor: 'text-[#2d4a22]',
  },
  {
    topic: 'social_media',
    tag: 'CYBERBULLYING',
    icon: '📱',
    title: 'Bị làm phiền hoặc chế giễu trên mạng',
    description:
      'Bạn không cần đưa mật khẩu cho bất kỳ ai. Có thể lưu lại bằng chứng phù hợp, dùng công cụ chặn/báo cáo của nền tảng và nói với người lớn đáng tin cậy, nhất là khi chuyện liên quan đến học sinh trong trường.',
    cta: 'Nói với MẦM về chuyện này',
    badgeBg: 'bg-[#e4efdf]',
    badgeColor: 'text-[#2d4a22]',
  },
  {
    topic: 'urgent',
    tag: 'AN TOÀN KHẨN CẤP',
    icon: '🆘',
    title: 'Khi bạn đang không an toàn',
    description:
      'Nếu bạn đang gặp nguy hiểm hoặc nghĩ mình có thể làm đau bản thân hay người khác, hãy đi tới một người lớn đáng tin cậy ở gần bạn ngay. Ở trường, hãy tìm thầy cô hoặc nhân viên nhà trường gần nhất.',
    cta: 'Tìm giúp đỡ ngay',
    urgent: true,
    badgeBg: 'bg-[#fcefee]',
    badgeColor: 'text-[#9e4a4a]',
  },
];

export function SupportTopicsGrid() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-10 text-center sm:text-left animate-fadeIn">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#5a824d]">
          GÓC HỖ TRỢ
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-[#2c4a24]">
          Một vài điều có thể giúp bạn bắt đầu
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-6">
          Những gợi ý này không thay thế sự giúp đỡ trực tiếp. Hãy chọn điều phù hợp với hoàn cảnh của bạn.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {helpTopics.map((item) => (
          <div
            key={item.topic}
            className={`group relative flex flex-col justify-between rounded-3xl border bg-white p-7 transition-all duration-300 animate-slideUp hover:-translate-y-1 hover:shadow-md ${
              item.urgent
                ? 'border-[#f2cecb] hover:border-[#eab8b2]'
                : 'border-[#e2ebd8] hover:border-[#82a875]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase ${item.badgeBg} ${item.badgeColor}`}
                >
                  {item.tag}
                </span>
                <span className="grid size-10 place-items-center rounded-2xl bg-[#f4f8f3] text-xl transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#2c4a24] mb-3 group-hover:text-[#2d4a22] transition-colors">
                {item.title}
              </h2>
              <p className="text-sm leading-6 text-slate-600 mb-6">
                {item.description}
              </p>
            </div>

            <div className="pt-2">
              {item.urgent ? (
                <Link
                  href="/help#urgent"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-[#9e4a4a] px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#853939] hover:shadow-xs active:scale-95"
                >
                  <span>{item.cta}</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">🚀</span>
                </Link>
              ) : (
                <Link
                  href={`/chat?topic=${item.topic}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#2d4a22] transition-all duration-200 hover:text-[#1f3617]"
                >
                  <span className="underline underline-offset-4 decoration-[#82a875] group-hover:decoration-[#2d4a22]">
                    {item.cta}
                  </span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}