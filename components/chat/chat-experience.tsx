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

const welcome: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Chào bạn 🌱 Bạn có thể bắt đầu bằng một câu rất đơn giản: “Mình đang gặp một chuyện…”. Mình sẽ lắng nghe và cùng bạn tìm một hướng phù hợp.',
};

function createSessionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mam-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatExperience() {
  const params = useSearchParams();
  const topicParam = params.get('topic') as SupportTopic | null;
  const [isReady, setIsReady] = useState(false);
  const [sessionId] = useState(createSessionId);
  const [messages, setMessages] = useState<Message[]>([]);
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
    setIsReady(true);
    setMessages([welcome]);
  }

  function chooseTopic(topic: SupportTopic) {
    setSelectedTopic(topic);
    setDraft('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: message };
    const history = messages.slice(-8).filter((item) => item.id !== 'welcome').map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message, topicHint: selectedTopic, history }),
      });
      const body = (await response.json()) as ChatApiResponse | { error?: string };
      if (!('message' in body)) throw new Error(body.error || 'Không thể gửi tin nhắn lúc này.');
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', content: body.message, level: body.supportLevel }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi tin nhắn lúc này.');
    } finally {
      setIsSending(false);
    }
  }

  const lastLevel = messages.at(-1)?.level;

  return (
    <div className="page-shell py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Không gian trò chuyện</p>
            <h1 className="mt-1 text-2xl font-extrabold text-ink">Mình đang ở đây để lắng nghe</h1>
          </div>
          <Link href="/help#urgent" className="rounded-full bg-[#f9e9e5] px-4 py-2 text-sm font-bold text-[#8a3939] hover:bg-[#f4dcd7]">🆘 Cần giúp ngay</Link>
        </div>

        {!isReady ? (
          <section className="card mx-auto max-w-2xl p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-moss-100 text-2xl">🌱</span>
            <h2 className="mt-5 text-2xl font-extrabold">Trước khi mình bắt đầu</h2>
            <p className="mt-3 leading-7 text-slate-700">MẦM là AI hỗ trợ bước đầu, không phải chuyên gia tâm lý và không thể thay thế người thật. Bạn không cần cho biết tên nếu chỉ muốn chia sẻ một điều bình thường.</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Đừng gửi mật khẩu, mã OTP, thông tin tài chính hoặc thông tin riêng tư không cần thiết.</li>
              <li>MẦM không thể hứa bí mật tuyệt đối; nếu có nguy cơ an toàn, điều quan trọng là kết nối với người lớn thật.</li>
              <li>Nếu bạn đang gặp nguy hiểm, hãy dùng nút “Cần giúp ngay” thay vì chờ trò chuyện.</li>
            </ul>
            <button type="button" onClick={beginChat} className="button-primary mt-7">Mình đã hiểu, bắt đầu trò chuyện</button>
          </section>
        ) : (
          <>
            <section className="card overflow-hidden">
              <div className="border-b border-moss-100 bg-moss-50 px-4 py-3 text-sm text-slate-700 sm:px-6">
                {selectedTopicLabel ? <>Chủ đề đang chọn: <strong>{selectedTopicLabel}</strong>. Bạn có thể đổi chủ đề hoặc kể theo cách của bạn.</> : 'Bạn có thể kể theo cách của bạn. Mình sẽ không phán xét.'}
              </div>
              <div ref={messagesRef} className="h-[min(60vh,640px)] min-h-[240px] space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-3xl px-4 py-3 leading-7 ${message.role === 'user' ? 'bg-moss-700 text-white' : message.level === 'red' ? 'border border-[#eab8b2] bg-[#fff7f5] text-ink' : 'bg-moss-50 text-ink'}`}>
                      {message.role === 'assistant' ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                            h1: ({ children }) => <h1 className="mb-2 text-lg font-bold">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-2 text-base font-bold">{children}</h2>,
                            h3: ({ children }) => <h3 className="mb-2 font-bold">{children}</h3>,
                            blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-moss-500 pl-3 text-slate-600">{children}</blockquote>,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">{children}</a>,
                            pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-xl bg-slate-900 p-3 text-sm text-slate-50">{children}</pre>,
                            code: ({ children, className }) => <code className={className || 'rounded bg-black/5 px-1 py-0.5 text-[0.9em]'}>{children}</code>,
                            table: ({ children }) => <div className="my-2 max-w-full overflow-x-auto"><table className="border-collapse text-left text-sm">{children}</table></div>,
                            th: ({ children }) => <th className="border border-moss-100 px-2 py-1 font-bold">{children}</th>,
                            td: ({ children }) => <td className="border border-moss-100 px-2 py-1">{children}</td>,
                            hr: () => <hr className="my-3 border-moss-100" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : message.content}
                    </div>
                  </div>
                ))}
                {isSending ? <div className="w-fit rounded-3xl bg-moss-50 px-4 py-3 text-sm text-slate-600">MẦM đang suy nghĩ…</div> : null}
              </div>
              {lastLevel === 'red' ? <div className="border-t border-[#eab8b2] p-4 sm:p-6"><SupportPanel emergency /></div> : null}
              {lastLevel === 'yellow' ? <div className="border-t border-moss-100 p-4 sm:p-6"><SupportPanel /></div> : null}
              <form onSubmit={submit} className="border-t border-moss-100 p-3 sm:p-4">
                <label htmlFor="chat-message" className="sr-only">Viết điều bạn muốn chia sẻ</label>
                <div className="flex items-end gap-2 rounded-2xl border border-moss-100 bg-white p-2 focus-within:border-moss-500">
                  <textarea id="chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Mình đang gặp một chuyện…" className="min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-2 leading-6 outline-none" disabled={isSending} />
                  <button type="submit" className="button-primary shrink-0 px-4 py-2.5" disabled={isSending}>{isSending ? 'Đang gửi' : 'Gửi'}</button>
                </div>
                {error ? <p role="alert" className="mt-2 text-sm text-[#9d403f]">{error}</p> : null}
                <p className="mt-2 px-2 text-xs text-slate-500">Không gửi mật khẩu, OTP, thông tin tài chính hoặc địa chỉ chính xác.</p>
              </form>
            </section>
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-slate-700">Chọn chủ đề nếu điều này giúp bạn bắt đầu:</p>
              <div className="flex flex-wrap gap-2">
                {topicShortcuts.map((topic) => <button key={topic.topic} type="button" onClick={() => chooseTopic(topic.topic)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${selectedTopic === topic.topic ? 'border-moss-700 bg-moss-700 text-white' : 'border-moss-100 bg-white text-moss-700 hover:bg-moss-50'}`}>{topic.icon} {topic.label}</button>)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
