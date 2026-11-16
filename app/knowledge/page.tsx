import { KnowledgeSearch } from '@/components/knowledge/knowledge-search';

export const metadata = {
  title: 'Thư viện tri thức tâm lý | MẦM',
  description: 'Tìm kiếm tài liệu tâm lý đã được xác minh và trích dẫn nguồn gốc.',
};

export default function KnowledgePage() {
  return (
    <main className="page-shell py-10 sm:py-14">
      <p className="eyebrow">PSYCHOLOGY LEARNING HUB</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Thư viện tri thức tâm lý</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">Khám phá tài liệu đã được quản lý nội dung xác minh. Nội dung tham khảo không thay thế tư vấn chuyên môn và không phải đánh giá tâm lý cá nhân.</p>
      <KnowledgeSearch />
    </main>
  );
}
