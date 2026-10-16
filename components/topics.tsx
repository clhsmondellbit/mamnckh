import Link from 'next/link';

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
          className="group flex min-h-24 items-center gap-3 rounded-2xl border border-moss-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-moss-500 hover:shadow-soft"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss-50 text-xl" aria-hidden="true">{topic.icon}</span>
          <span className="font-bold text-ink group-hover:text-moss-700">{topic.label}</span>
        </Link>
      ))}
    </div>
  );
}
