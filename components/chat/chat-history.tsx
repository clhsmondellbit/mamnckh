'use client';

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
};

export function ChatHistoryList({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400 text-center">
        Chưa có lịch sử trò chuyện nào.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 p-2">
      <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#5a824d]">
        Lịch sử trò chuyện
      </div>
      {/* Hiển thị toàn bộ danh sách, không cắt giới hạn 3 mục */}
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        return (
          <div
            key={session.id}
            className={`group flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs transition-all ${
              isActive
                ? 'bg-[#e4efdf] font-bold text-[#2c4a24]'
                : 'text-slate-600 hover:bg-[#f4f8f3] hover:text-[#2d4a22]'
            }`}
          >
            <button
              onClick={() => onSelectSession(session.id)}
              className="flex-1 text-left truncate outline-none"
            >
              {session.title || 'Cuộc trò chuyện mới'}
            </button>

            {/* Nút xoá phiên trò chuyện */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#9e4a4a] transition-opacity"
              title="Xóa phiên này"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}