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
              title: s.title === '✨ Cuộc trò chuyện mới' ? (message.length > 22 ? message.slice(0, 22) + '...' : message) : s.title,
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
    <div className="flex h-[calc(100vh-65px)] w-full overflow-hidden bg-sand">
      {/* SIDEBAR BÊN TRÁI THU GỌN VÀ CÂN ĐỐI */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-moss-100 bg-[#f4f8f1] p-3.5 text-moss-700 lg:flex">
        <button
          type="button"
          onClick={startNewChat}
          className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-moss-100 bg-white px-3.5 py-2.5 text-xs font-bold text-moss-700 shadow-xs transition hover:bg-moss-50 active:scale-98 cursor-pointer"
        >
          <span>✨</span> Cuộc trò chuyện mới
        </button>

        <div className="mb-2 px-2 text-[10px] font-extrabold uppercase tracking-wider text-moss-500">
          Lịch sử trò chuyện 🌱
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {sessions.map((item) => (
            <div
              key={item.id}
              onClick={() => selectSession(item.id)}
              className={`group flex items-center justify-between w-full rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                item.id === currentSessionId
                  ? 'bg-moss-700 text-white shadow-xs'
                  : 'text-moss-700 hover:bg-moss-100/60'
              }`}
            >
              <span className="truncate flex-1">{item.title}</span>
              <button
                type="button"
                onClick={(e) => deleteSession(e, item.id)}
                title="Xóa cuộc trò chuyện"
                className={`ml-1.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition ${
                  item.id === currentSessionId ? 'text-white hover:bg-white/20' : 'text-moss-700 hover:bg-black/5'
                }`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-moss-100 pt-2.5 text-[11px] font-medium text-moss-500 text-center">
          <p>🌱 MẦM — Lan tỏa năng lượng tích cực</p>
        </div>
      </aside>

      {/* CỘT CHAT CHÍNH VỚI KHU VỰC THU HẸP ẤM CỦNG (MAX-W-3XL) */}
      <main className="flex flex-1 flex-col h-full bg-white animate-fadeIn">
        {!isReady ? (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center animate-fadeIn">
            <section className="card mx-auto max-w-xl rounded-3xl border border-moss-100 bg-white p-6 shadow-soft text-center sm:text-left">
              <div className="mx-auto sm:mx-0 grid size-12 place-items-center rounded-2xl bg-moss-100 text-2xl mb-3">🌱</div>
              <h2 className="text-xl font-extrabold text-moss-700">Chào mừng bạn đến với MẦM!</h2>
              <p className="mt-2 text-xs leading-6 text-slate-600">Đây là không gian an toàn, thân thiện để bạn chia sẻ mọi điều trong cuộc sống học đường. MẦM luôn ở đây lắng nghe và đồng hành cùng bạn nha! 💚</p>
              <div className="mt-3 rounded-2xl bg-moss-50 p-3.5 text-xs text-moss-700 space-y-1 font-medium">
                <p>💡 <strong>Góc nhỏ lưu ý:</strong> Đừng gửi mật khẩu, mã OTP hay thông tin cá nhân bảo mật nhé.</p>
              </div>
              <button type="button" onClick={beginChat} className="button-primary mt-5 w-full text-xs cursor-pointer">Bắt đầu trò chuyện ngay thôi! 🚀</button>
            </section>
          </div>
        ) : (
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 sm:px-6">
            <header className="py-3 border-b border-slate-100 flex items-center justify-between shrink-0 animate-fadeIn">
              <div>
                <h1 className="text-base font-extrabold text-moss-700 flex items-center gap-1.5">
                  <span>✨</span> Không gian trò chuyện thân thiện
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedTopicLabel ? <>Chủ đề đang chọn: <strong className="text-moss-600">{selectedTopicLabel}</strong></> : 'Cứ thoải mái chia sẻ mọi điều bạn muốn nhé!'}
                </p>
              </div>
            </header>

            {/* DANH SÁCH BONG BÓNG TIN NHẮN GIỮA MẦM VÀ HỌC SINH */}
            <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto py-5 pr-1" aria-live="polite">
              {messages.map((message, index) => (
                <div key={message.id} className={`flex gap-2.5 animate-fadeIn ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' ? (
                    <div className="grid size-8 shrink-0 place-items-center rounded-2xl bg-moss-100 text-base shadow-xs mt-0.5">🌱</div>
                  ) : null}

                  <div className={`max-w-[85%] rounded-3xl px-4.5 py-3 text-xs sm:text-sm leading-6 shadow-xs ${
                    message.role === 'user'
                      ? 'bg-moss-700 text-white rounded-tr-xs'
                      : message.level === 'red'
                      ? 'border border-[#f2cecb] bg-[#fff7f5] text-slate-800 rounded-tl-xs'
                      : 'bg-moss-100/70 text-moss-700 border border-moss-100 rounded-tl-xs'
                  }`}>
                    {message.role === 'assistant' ? (
                      <>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-1.5 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-1.5 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
                            h1: ({ children }) => <h1 className="mb-1 font-bold text-sm">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-1 font-bold text-xs">{children}</h2>,
                            blockquote: ({ children }) => <blockquote className="my-1.5 border-l-2 border-moss-500 pl-2 text-slate-600">{children}</blockquote>,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-moss-700 underline">{children}</a>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>

                        {/* NÚT CHỌN NHANH CHỦ ĐỀ Ở TIN NHẮN ĐẦU TIÊN */}
                        {index === 0 && messages.length === 1 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 pt-1 border-t border-moss-100/80">
                            {optionsList.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => sendSpecificMessage(opt)}
                                disabled={isSending}
                                className="rounded-full border border-moss-500/30 bg-white px-3 py-1 text-[11px] font-bold text-moss-700 shadow-xs transition hover:bg-moss-700 hover:text-white hover:border-moss-700 active:scale-95 cursor-pointer"
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
                  <div className="grid size-8 shrink-0 place-items-center rounded-2xl bg-moss-100 text-base">🌱</div>
                  <div className="rounded-2xl bg-moss-50 px-3.5 py-2 text-xs font-medium text-moss-600 flex items-center gap-1.5">
                    <span>MẦM đang suy nghĩ câu trả lời...</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Ô NHẬP TIN NHẮN BÊN DƯỚI */}
            <footer className="shrink-0 pb-4 pt-1">
              {lastLevel === 'red' ? <div className="mb-2.5"><SupportPanel emergency /></div> : null}
              {lastLevel === 'yellow' ? <div className="mb-2.5"><SupportPanel /></div> : null}
              <form onSubmit={submit}>
                <label htmlFor="chat-message" className="sr-only">Viết điều muốn chia sẻ</label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 transition focus-within:border-moss-700 focus-within:ring-1 focus-within:ring-moss-700/20 shadow-xs">
                  <textarea
                    id="chat-message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={2000}
                    rows={1}
                    placeholder="Hôm nay bạn muốn tâm sự điều gì với MẦM..."
                    className="flex-1 resize-none border-0 bg-transparent px-2 py-1 outline-none text-moss-700 placeholder-slate-400 text-xs sm:text-sm"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-moss-700 px-4 py-2 font-bold text-white transition hover:bg-moss-600 disabled:opacity-50 cursor-pointer text-xs shadow-xs"
                    disabled={isSending}
                  >
                    {isSending ? 'Đang gửi' : 'Gửi 🚀'}
                  </button>
                </div>
                {error ? <p role="alert" className="mt-1 text-xs text-[#9e4a4a]">{error}</p> : null}
                <p className="mt-1 text-[10px] text-slate-400 text-center">Không gửi mật khẩu, OTP, thông tin tài chính hoặc địa chỉ chính xác.</p>
              </form>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}