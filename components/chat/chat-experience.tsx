'use client';

import Link from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SupportPanel } from '@/components/safety/support-panel';
import { topicShortcuts } from '@/components/topics';
import type { ChatApiResponse, SupportLevel, SupportTopic } from '@/lib/types';

type Message = { id: string; role: 'user' | 'assistant'; content: string; level?: SupportLevel };
type ChatSession = { id: string; title: string; messages: Message[]; isReady: boolean };

const welcomeText = `Chào bạn tuyệt vời! 🌟 Mình là **MẦM** – Bạn đồng hành nhỏ xinh luôn sẵn sàng lắng nghe đây 🌱. 

Hôm nay thế giới của bạn thế nào? Có chuyện gì vui muốn kể, hay có góc nào đang nặng lòng cần chia sẻ không? Cứ thoải mái trút bầu tâm sự với mình nhé, tụi mình cùng gỡ rối nha! ✨`;

const welcome: Message = {
  id: 'welcome',
  role: 'assistant',
  content: welcomeText,
};

const optionsList = [
  "📚 Học tập – thi cử",
  "👥 Bạn bè",
  "🏠 Gia đình",
  "🏫 Thầy cô – trường lớp",
  "💖 Tình cảm",
  "😌 Cảm xúc của bản thân",
  "💬 Chuyện khác"
];

function createSessionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mam-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatExperience() {
  const params = useSearchParams();
  const topicParam = params.get('topic') as SupportTopic | null;
  
  // KHỞI TẠO DUY NHẤT 1 CUỘC TRÒ CHUYỆN MỚI BAN ĐẦU, KHÔNG CÒN 3 MẪU CŨ
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: 'session-1', title: '✨ Cuộc trò chuyện mới', messages: [welcome], isReady: true }
  ]);
  
  const [currentSessionId, setCurrentSessionId] = useState<string>('session-1');
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
      title: '✨ Cuộc trò chuyện mới',
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
      setSessions([{ id: newId, title: '✨ Cuộc trò chuyện mới', messages: [], isReady: false }]);
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
              title: s.title === '✨ Cuộc trò chuyện mới' ? message.slice(0, 28) + '...' : s.title,
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
    <div className="flex h-[calc(100vh-65px)] w-full overflow-hidden bg-white">
      {/* SIDEBAR BÊN TRÁI VỚI HIỆU ỨNG CHUYỂN ĐỔI MƯỢT MÀ */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-[#e2ebd8] bg-[#f4f8f3] p-4 text-[#2c4a24] lg:flex">
        <button
          type="button"
          onClick={startNewChat}
          className="mb-6 flex items-center justify-center gap-2.5 rounded-2xl border border-[#c2d8b8] bg-white px-4 py-3 text-sm font-bold text-[#2d4a22] shadow-xs transition-all duration-200 hover:bg-[#eaf4e6] hover:border-[#82a875] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span className="text-base animate-bounce">✨</span> Cuộc trò chuyện mới
        </button>

        <div className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-wider text-[#5a824d]">
          Lịch sử trò chuyện 🌱
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {sessions.map((item) => (
            <div
              key={item.id}
              onClick={() => selectSession(item.id)}
              className={`group flex items-center justify-between w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                item.id === currentSessionId
                  ? 'bg-[#2d4a22] text-white shadow-sm scale-[1.01]'
                  : 'text-[#38582d] hover:bg-[#e4efdf] hover:text-[#1c3316] hover:translate-x-1'
              }`}
            >
              <span className="truncate flex-1">{item.title}</span>
              <button
                type="button"
                onClick={(e) => deleteSession(e, item.id)}
                title="Xóa cuộc trò chuyện"
                className={`ml-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                  item.id === currentSessionId ? 'text-white hover:bg-white/20' : 'text-[#38582d] hover:bg-black/5'
                }`}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-[#e2ebd8] pt-3 text-xs font-medium text-[#658858] text-center">
          <p>🌱 MẦM — Lan tỏa năng lượng tích cực</p>
        </div>
      </aside>

      {/* CHAT CONTAINER BÊN PHẢI */}
      <main className="flex flex-1 flex-col h-full bg-white animate-fadeIn">
        {!isReady ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center animate-slideUp">
            <section className="card mx-auto max-w-2xl rounded-3xl border border-[#e2ebd8] bg-white p-6 shadow-sm sm:p-8 text-center sm:text-left transition-all hover:shadow-md">
              <div className="mx-auto sm:mx-0 grid size-14 place-items-center rounded-2xl bg-[#e4efdf] text-3xl mb-4 animate-pulse">🌱</div>
              <h2 className="text-2xl font-extrabold text-[#2c4a24]">Chào mừng bạn đến với MẦM!</h2>
              <p className="mt-3 leading-7 text-slate-600">Đây là không gian an toàn, thân thiện để bạn chia sẻ mọi điều trong cuộc sống học đường. MẦM luôn ở đây lắng nghe và đồng hành cùng bạn nha! 💚</p>
              <div className="mt-4 rounded-2xl bg-[#f2f8f0] p-4 text-xs sm:text-sm text-[#3a5a30] space-y-1.5 font-medium">
                <p>💡 <strong>Góc nhỏ lưu ý:</strong> Đừng gửi mật khẩu, mã OTP hay thông tin cá nhân bảo mật nhé.</p>
                <p>🆘 Nếu bạn đang gặp tình huống khẩn cấp, hãy sử dụng nút trợ giúp khẩn cấp trên thanh điều hướng.</p>
              </div>
              <button type="button" onClick={beginChat} className="mt-6 w-full rounded-2xl bg-[#2d4a22] px-5 py-3.5 font-bold text-white transition-all duration-200 hover:bg-[#1f3617] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer">Bắt đầu trò chuyện ngay thôi! 🚀</button>
            </section>
          </div>
        ) : (
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 sm:px-8">
            <header className="py-4 border-b border-slate-100 flex items-center justify-between shrink-0 animate-fadeIn">
              <div>
                <h1 className="text-xl font-extrabold text-[#2c4a24] flex items-center gap-2">
                  <span className="animate-spin duration-1000">✨</span> Không gian trò chuyện thân thiện
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedTopicLabel ? <>Chủ đề đang chọn: <strong className="text-[#3a5a30]">{selectedTopicLabel}</strong></> : 'Cứ thoải mái chia sẻ mọi điều bạn muốn nhé!'}
                </p>
              </div>
            </header>

            {/* KHU VỰC TIN NHẮN VỚI HIỆU ỨNG XUẤT HIỆN */}
            <div ref={messagesRef} className="flex-1 space-y-5 overflow-y-auto py-6 pr-2" aria-live="polite">
              {messages.map((message, index) => (
                <div key={message.id} className={`flex transition-all duration-300 animate-slideUp ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-3xl px-5 py-3.5 leading-7 shadow-xs transition-all ${message.role === 'user' ? 'bg-[#2d4a22] text-white hover:shadow-md' : message.level === 'red' ? 'border border-[#eab8b2] bg-[#fff7f5] text-ink' : 'bg-[#e4efdf] text-[#2c4a24] hover:shadow-xs'}`}>
                    {message.role === 'assistant' ? (
                      <>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                            h1: ({ children }) => <h1 className="mb-2 text-lg font-bold">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-2 text-base font-bold">{children}</h2>,
                            h3: ({ children }) => <h3 className="mb-2 font-bold">{children}</h3>,
                            blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-[#82a875] pl-3 text-slate-700">{children}</blockquote>,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#2d4a22] underline underline-offset-2">{children}</a>,
                            pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-xl bg-[#1f3617] p-3 text-sm text-white">{children}</pre>,
                            code: ({ children, className }) => <code className={className || 'rounded bg-white/60 px-1 py-0.5 text-[0.9em]'}>{children}</code>,
                            table: ({ children }) => <div className="my-2 max-w-full overflow-x-auto"><table className="border-collapse text-left text-sm">{children}</table></div>,
                            th: ({ children }) => <th className="border border-[#cbe3c3] px-2 py-1 font-bold">{children}</th>,
                            td: ({ children }) => <td className="border border-[#cbe3c3] px-2 py-1">{children}</td>,
                            hr: () => <hr className="my-3 border-[#cbe3c3]" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>

                        {index === 0 && messages.length === 1 && (
                          <div className="mt-4 flex flex-wrap gap-2 pt-1 animate-fadeIn">
                            {optionsList.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => sendSpecificMessage(opt)}
                                disabled={isSending}
                                className="rounded-full border border-[#b5cca8] bg-white px-3.5 py-1.5 text-xs font-bold text-[#2c4a24] shadow-xs transition-all duration-200 hover:bg-[#2d4a22] hover:text-white hover:border-[#2d4a22] hover:scale-105 active:scale-95 cursor-pointer"
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
                <div className="w-fit rounded-3xl bg-[#e4efdf] px-4 py-2.5 text-sm font-medium text-[#4a6b3f] animate-pulse flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-[#2d4a22] animate-bounce"></span>
                  <span className="inline-block size-2 rounded-full bg-[#2d4a22] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="inline-block size-2 rounded-full bg-[#2d4a22] animate-bounce [animation-delay:0.4s]"></span>
                  <span>MẦM đang suy nghĩ câu trả lời cho bạn...</span>
                </div>
              ) : null}
            </div>

            {/* Ô NHẬP TIN NHẮN VỚI HIỆU ỨNG FOCUS MƯỢT MÀ */}
            <footer className="shrink-0 pb-5 pt-2">
              {lastLevel === 'red' ? <div className="mb-3 animate-slideUp"><SupportPanel emergency /></div> : null}
              {lastLevel === 'yellow' ? <div className="mb-3 animate-slideUp"><SupportPanel /></div> : null}
              <form onSubmit={submit}>
                <label htmlFor="chat-message" className="sr-only">Viết điều muốn chia sẻ</label>
                <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2.5 transition-all duration-200 focus-within:border-[#2d4a22] focus-within:ring-2 focus-within:ring-[#2d4a22]/20 shadow-xs">
                  <textarea id="chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Hôm nay bạn muốn tâm sự điều gì với MẦM..." className="min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 leading-6 outline-none text-[#2c4a24] placeholder-slate-400 text-sm sm:text-base" disabled={isSending} />
                  <button type="submit" className="shrink-0 rounded-xl bg-[#2d4a22] px-5 py-2.5 font-bold text-white transition-all duration-200 hover:bg-[#1f3617] hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer text-sm shadow-xs" disabled={isSending}>{isSending ? 'Đang gửi' : 'Gửi 🚀'}</button>
                </div>
                {error ? <p role="alert" className="mt-1.5 text-xs text-[#9e4a4a] animate-shake">{error}</p> : null}
                <p className="mt-1.5 px-1 text-[11px] text-slate-400 text-center">Không gửi mật khẩu, OTP, thông tin tài chính hoặc địa chỉ chính xác.</p>
              </form>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}