import { ChatExperience } from '@/components/chat/chat-experience';
import { Suspense } from 'react';

export default function ChatPage() {
  return <Suspense fallback={<div className="page-shell py-10 text-slate-600">Đang mở không gian trò chuyện…</div>}><ChatExperience /></Suspense>;
}
