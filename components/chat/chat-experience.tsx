'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SupportPanel } from '@/components/safety/support-panel';
import { topicShortcuts } from '@/components/topics';
import type { ChatApiResponse, SupportLevel, SupportTopic } from '@/lib/types';

type Message = { id: string; role: 'user' | 'assistant'; content: string; level?: SupportLevel };
type ChatSession = { id: string; title: string; messages: Message[]; isReady: boolean };

const welcomeText = `Chào bạn tuyệt vời!  Mình là **MẦM** – Bạn đồng hành nhỏ xinh luôn sẵn sàng lắng nghe đây 🌱. 

Hôm nay thế giới của bạn thế nào? Có chuyện gì vui muốn kể, hay có góc nào đang nặng lòng cần chia sẻ không? Cứ thoải mái trút bầu tâm sự với mình nhé, tụi mình cùng gỡ rối nha! `;

const welcome: Message = {
  id: 'welcome',
  role: 'assistant',
  content: welcomeText,
};

const optionsList = [
  " Học tập – thi cử",
  " Bạn bè",
  " Gia đình",
  " Thầy cô – trường lớp",
  " Tình cảm",
  " Cảm xúc của bản thân",
  " Chuyện khác"
];

function createSessionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mam-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatExperience() {
  const params = useSearchParams();
  const topicParam = params.get('topic') as SupportTopic | null;
  
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: 'session-1', title: ' Cuộc trò chuyện mới', messages: [welcome], isReady: true }
  ]);
  
  const [currentSessionId, setCurrentSessionId] = useState<string>('session-1');
  // Trạng thái bật/tắt Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const isReady = currentSession?.isReady ?? false;
  const messages = currentSession?.messages ?? [];

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<SupportTopic | undefined>(topicParam || undefined);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const selectedTopicLabel = useMemo(
    () => topicShortcuts.find((topic) => topic.topic === selectedTopic)?.label,
    [selectedTopic],
  );

  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (messagesElement) {
      messagesElement.scrollTo({ top: messagesElement.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isSending]);

  function beginChat() {
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, isReady: true, messages: [welcome] } : s))
    );
  }

  function startNewChat() {
    const newId = createSessionId();
    const newSession: ChatSession = {
      id: newId,
      title: ' Cuộc trò chuyện mới',
      messages: [],
      isReady: false,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setSelectedTopic(undefined);
  }

  function selectSession(id: string) {
    setCurrentSessionId(id);
    setError(null);
  }

  function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const remainingSessions = sessions.filter((s) => s.id !== id);
    
    if (remainingSessions.length === 0) {
      const newId = createSessionId();
      setSessions([{ id: newId, title: ' Cuộc trò chuyện mới', messages: [], isReady: false }]);
      setCurrentSessionId(newId);
    } else {
      setSessions(remainingSessions);
      if (id === currentSessionId) {
        setCurrentSessionId(remainingSessions[0].id);
      }
    }
  }

  async function sendSpecificMessage(messageText: string) {
    const message = messageText.trim();
    if (!message || isSending) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: message };
    const history = messages.slice(-8).filter((item) => item.id !== 'welcome').map(({ role, content }) => ({ role, content }));
    
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: s.title === ' Cuộc trò chuyện mới' ? (message.length > 22 ? message.slice(0, 22) + '...' : message) : s.title,
              messages: [...s.messages, userMessage],
            }
          : s
      )
    );

    setDraft('');
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId, message, topicHint: selectedTopic, history }),
      });
      const body = (await response.json()) as ChatApiResponse | { error?: string };
      if (!('message' in body)) throw new Error(body.error || 'Không thể gửi tin nhắn lúc này.');
      
      const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', content: body.message, level: body.supportLevel };
      
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi tin nhắn lúc này.');
    } finally {
      setIsSending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendSpecificMessage(draft);
  }

  const lastLevel = messages.at(-1)?.level;

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-[#fafbf7] animate-fadeIn text-[#2c4a24]">
      {/* NÚT TOGGLE 3 GẠCH NẰM GÓC TRÊN BÊN TRÁI (KÈM CHỮ NẾU SIDEBAR ĐÓNG) */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className="fixed top-3 left-3 z-50 flex items-center gap-2 rounded-2xl border border-[#c2d8b8] bg-white px-3 py-2 text-xs font-bold text-[#2c4a24] shadow-xs hover:bg-[#e4efdf] transition cursor-pointer active:scale-95"
        title={isSidebarOpen ? "Thu gọn sidebar" : "Mở lịch sử trò chuyện"}
      >
        <span className="text-sm font-black">☰</span>
        {!isSidebarOpen && <span className="whitespace-nowrap font-semibold">Lịch sử trò chuyện</span>}
      </button>

      {/* SIDEBAR BÊN TRÁI VỚI LOGO MẦM NẰM NGAY CẠNH NÚT 3 GẠCH KHI MỞ */}
      <aside
        className={`shrink-0 flex flex-col border-r border-[#e2ebd8] bg-[#f4f8f3] pt-3.5 pb-3.5 px-3.5 text-[#2c4a24] transition-all duration-200 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-64 opacity-100' : 'w-0 p-0 border-none opacity-0'
        }`}
      >
        <div className="w-56 flex flex-col h-full">
          {/* LOGO MẦM NẰM TRÊN CÙNG */}
          <div className="mb-4 flex items-center pl-12">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="grid size-9 place-items-center rounded-2xl bg-[#e4efdf] text-xl shadow-xs transition group-hover:scale-105">
                🌱
              </div>
              <div>
                <span className="font-black text-sm text-[#2c4a24] tracking-tight block">MẦM</span>
                <span className="text-[10px] text-slate-500 font-medium block">Đồng hành học đường</span>
              </div>
            </Link>
          </div>

          {/* NÚT TẠO CUỘC TRÒ CHUYỆN MỚI */}
          <button
            type="button"
            onClick={startNewChat}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c2d8b8] bg-white px-3.5 py-2.5 text-xs font-bold text-[#2d4a22] shadow-xs transition hover:bg-[#eaf4e6] active:scale-98 cursor-pointer"
          >
            <span></span> Cuộc trò chuyện mới
          </button>

          <div className="mb-2 px-2 text-[10px] font-extrabold uppercase tracking-wider text-[#5a824d]">
            Lịch sử trò chuyện 🌱
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto pr-1">
            {sessions.map((item) => (
              <div
                key={item.id}
                onClick={() => selectSession(item.id)}
                className={`group flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                  item.id === currentSessionId
                    ? 'bg-[#2d4a22] text-white shadow-xs'
                    : 'text-[#38582d] hover:bg-[#e4efdf]'
                }`}
              >
                <span className="truncate flex-1">{item.title}</span>
                <button
                  type="button"
                  onClick={(e) => deleteSession(e, item.id)}
                  title="Xóa cuộc trò chuyện"
                  className={`ml-1.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition ${
                    item.id === currentSessionId ? 'text-white hover:bg-white/20' : 'text-[#38582d] hover:bg-black/5'
                  }`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-auto border-t border-[#e2ebd8] pt-2.5 text-[11px] font-medium text-[#658858] text-center">
            <p>🌱 MẦM — Lan tỏa năng lượng tích cực</p>
          </div>
        </div>
      </aside>

      {/* CỘT KHUNG CHAT CHÍNH */}
      <main className="relative flex flex-1 flex-col h-full bg-white">
        {!isReady ? (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center animate-fadeIn">
            <section className="card mx-auto max-w-xl rounded-3xl border border-[#e2ebd8] bg-white p-6 shadow-soft text-center sm:text-left">
              <div className="mx-auto sm:mx-0 grid size-12 place-items-center rounded-2xl bg-[#e4efdf] text-2xl mb-3">🌱</div>
              <h2 className="text-xl font-extrabold text-[#2c4a24]">Chào mừng bạn đến với MẦM!</h2>
              <p className="mt-2 text-xs leading-6 text-slate-600">Đây là không gian an toàn, thân thiện để bạn chia sẻ mọi điều trong cuộc sống học đường. MẦM luôn ở đây lắng nghe và đồng hành cùng bạn nha! 💚</p>
              <div className="mt-3 rounded-2xl bg-[#f2f8f0] p-3.5 text-xs text-[#3a5a30] space-y-1 font-medium">
                <p> <strong>Góc nhỏ lưu ý:</strong> Đừng gửi mật khẩu, mã OTP hay thông tin cá nhân bảo mật nhé.</p>
              </div>
              <button type="button" onClick={beginChat} className="inline-flex items-center justify-center rounded-2xl bg-[#2d4a22] px-5 py-3 font-bold text-white transition hover:bg-[#1f3617] mt-5 w-full text-xs cursor-pointer">Bắt đầu trò chuyện ngay thôi! 🚀</button>
            </section>
          </div>
        ) : (
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 sm:px-6 pt-4">
            {/* KHU VỰC CHAT TIN NHẮN */}
            <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto py-5 pr-1" aria-live="polite">
              {messages.map((message, index) => (
                <div key={message.id} className={`flex gap-2.5 animate-fadeIn ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' ? (
                    <div className="grid size-8 shrink-0 place-items-center rounded-2xl bg-[#e4efdf] text-base shadow-xs mt-0.5">🌱</div>
                  ) : null}

                  <div className={`max-w-[85%] rounded-3xl px-4.5 py-3 text-xs sm:text-sm leading-6 shadow-xs ${
                    message.role === 'user'
                      ? 'bg-[#2d4a22] text-white rounded-tr-xs'
                      : message.level === 'red'
                      ? 'border border-[#f2cecb] bg-[#fff7f5] text-slate-800 rounded-tl-xs'
                      : 'bg-[#e4efdf] text-[#2c4a24] rounded-tl-xs'
                  }`}>
                    {message.role === 'assistant' ? (
                      <>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0 text-[#2c4a24]">{children}</p>,
                            ul: ({ children }) => <ul className="mb-1.5 list-disc space-y-1 pl-4 last:mb-0 text-[#2c4a24]">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-1.5 list-decimal space-y-1 pl-4 last:mb-0 text-[#2c4a24]">{children}</ol>,
                            h1: ({ children }) => <h1 className="mb-1 font-bold text-sm text-[#2c4a24]">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-1 font-bold text-xs text-[#2c4a24]">{children}</h2>,
                            blockquote: ({ children }) => <blockquote className="my-1.5 border-l-2 border-[#82a875] pl-2 text-slate-700">{children}</blockquote>,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#2d4a22] underline">{children}</a>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>

                        {index === 0 && messages.length === 1 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 pt-1 border-t border-[#c2d8b8]/60">
                            {optionsList.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => sendSpecificMessage(opt)}
                                disabled={isSending}
                                className="rounded-full border border-[#b5cca8] bg-white px-3 py-1 text-[11px] font-bold text-[#2c4a24] shadow-xs transition hover:bg-[#2d4a22] hover:text-white hover:border-[#2d4a22] active:scale-95 cursor-pointer"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : message.content}
                  </div>
                </div>
              ))}

              {isSending ? (
                <div className="flex gap-2.5 items-center">
                  <div className="grid size-8 shrink-0 place-items-center rounded-2xl bg-[#e4efdf] text-base">🌱</div>
                  <div className="rounded-2xl bg-[#f2f8f0] px-3.5 py-2 text-xs font-medium text-[#3a5a30] flex items-center gap-1.5">
                    <span>MẦM đang suy nghĩ câu trả lời...</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Ô NHẬP TIN NHẮN */}
            <footer className="shrink-0 pb-4 pt-1">
              {lastLevel === 'red' ? <div className="mb-2.5"><SupportPanel emergency /></div> : null}
              {lastLevel === 'yellow' ? <div className="mb-2.5"><SupportPanel /></div> : null}
              <form onSubmit={submit}>
                <label htmlFor="chat-message" className="sr-only">Viết điều muốn chia sẻ</label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 transition focus-within:border-[#2d4a22] focus-within:ring-1 focus-within:ring-[#2d4a22]/20 shadow-xs">
                  <textarea
                    id="chat-message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={2000}
                    rows={1}
                    placeholder="Hôm nay bạn muốn tâm sự điều gì với MẦM..."
                    className="flex-1 resize-none border-0 bg-transparent px-2 py-1 outline-none text-[#2c4a24] placeholder-slate-400 text-xs sm:text-sm"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-[#e4efdf] px-4 py-2 font-bold text-[#2c4a24] transition hover:bg-[#d5e5cf] disabled:opacity-50 cursor-pointer text-xs shadow-xs border border-[#c2d8b8]/50"
                    disabled={isSending}
                  >
                    {isSending ? 'Đang gửi' : 'Gửi '}
                  </button>
                </div>
                {error ? <p role="alert" className="mt-1 text-xs text-[#9e4a4a]">{error}</p> : null}
                <p className="mt-1 text-[10px] text-slate-400 text-center">Không gửi mật khẩu, OTP, thông tin tài chính hoặc địa chỉ chính xác.</p>
              </form>
            </footer>
          </div>
        )}

        {/* NÚT CỐ ĐỊNH NỔI Ở GÓC DƯỚI BÊN PHẢI (ĐÃ ĐƯỢC LÀM TO HƠN) */}
        <Link
          href="/"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border-2 border-[#2d4a22] bg-white px-5 py-3 text-sm font-extrabold text-[#2c4a24] shadow-lg backdrop-blur-xs transition hover:bg-[#2d4a22] hover:text-white active:scale-95 cursor-pointer"
          title="Quay lại trang chủ"
        >
          <span className="text-base">⬅</span>
          <span>Trang chủ</span>
        </Link>
      </main>
    </div>
  );
}