import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';

export const metadata = { title: 'Research Lab | MẦM' };

export default async function StaffResearchPage() {
  const actor = await getCurrentStaffSession();
  if (!actor) redirect('/staff/login');
  if (!staffHasRole(actor, ['super_admin', 'admin', 'technical_operator'])) redirect('/staff/dashboard');

  return (
    <main className="page-shell space-y-6 py-10">
      <div><p className="eyebrow">INTERNAL EVALUATION</p><h1 className="mt-2 text-3xl font-extrabold text-ink">MẦM Research Lab</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">Khu vực nội bộ dành cho đánh giá kỹ thuật. Nội dung ở đây không phải công cụ chẩn đoán và không được dùng để xếp hạng học sinh.</p></div>
      <section className="card p-5 sm:p-6"><h2 className="text-lg font-bold">Synthetic regression suite</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bộ dữ liệu hiện có gồm 8 tình huống tổng hợp tiếng Việt, kiểm tra deterministic safety classifier và intent routing. Nó không gọi model, không đánh giá chất lượng lâm sàng và không so sánh GPT/Gemini/Claude.</p><div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">LỆNH CHẠY TRONG MÔI TRƯỜNG CÓ DEPENDENCY</p><code className="mt-1 block text-sm">npm run research:eval</code></div><p className="mt-3 text-xs leading-5 text-slate-500">Chưa có kết quả benchmark thực tế được ghi nhận trong bản bàn giao này. Hãy chạy lệnh và lưu log kết quả cùng phiên bản code trước khi đưa ra bất kỳ tuyên bố hiệu năng nào.</p><Link href="/staff/dashboard" className="mt-4 inline-flex text-sm font-semibold text-moss-700 underline">Quay lại khu vực nhân sự</Link></section>
      <section className="card p-5 sm:p-6"><h2 className="text-lg font-bold">Các trục đánh giá mở rộng</h2><ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2"><li>• Emotional/contextual understanding</li><li>• Conversation relevance and clarity</li><li>• Evidence grounding and RAG retrieval</li><li>• Hallucination and uncertainty</li><li>• Memory correctness and consent</li><li>• Safety routing and false positives</li><li>• Bias/fairness across language variants</li><li>• Latency, tokens and provider availability</li></ul><p className="mt-3 text-xs leading-5 text-slate-500">Các trục trên là rubric cần phát triển thêm; không có scorecard hoặc kết quả tự động giả lập trong giao diện.</p></section>
    </main>
  );
}
