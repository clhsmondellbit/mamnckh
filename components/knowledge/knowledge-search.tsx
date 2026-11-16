'use client';

import { FormEvent, useState } from 'react';

type Result = {
  documentId: string;
  title: string;
  summary: string;
  publisher: string;
  authors: string[];
  sourceUrl: string;
  publishedAt: string | null;
  verifiedAt: string;
  language: 'vi' | 'en';
  evidenceType: string;
  excerpt: string;
  relevance: number;
};

export function KnowledgeSearch() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) { setError('Hãy nhập ít nhất 2 ký tự.'); return; }
    setBusy(true); setError(''); setSearched(true);
    try {
      const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query.trim())}&lang=${language}`, { cache: 'no-store' });
      const body = await response.json() as { results?: Result[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Không thể tìm kiếm tài liệu.');
      setResults(Array.isArray(body.results) ? body.results : []);
    } catch (requestError) {
      setResults([]);
      setError(requestError instanceof Error ? requestError.message : 'Không thể tìm kiếm tài liệu.');
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-8 space-y-5">
      <section className="card p-5 sm:p-6">
        <form onSubmit={search} className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
          <label className="text-sm font-semibold">Từ khóa hoặc khái niệm<input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={180} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="Ví dụ: cảm xúc, áp lực học tập, giao tiếp…" /></label>
          <label className="text-sm font-semibold">Ngôn ngữ<select value={language} onChange={(event) => setLanguage(event.target.value as 'vi' | 'en')} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
          <button className="button-primary text-sm" type="submit" disabled={busy}>{busy ? 'Đang tìm…' : 'Tìm tài liệu'}</button>
        </form>
        <p className="mt-3 text-xs leading-5 text-slate-500">Chỉ hiển thị tài liệu đã được người quản lý xác minh và xuất bản. Hệ thống hiện dùng tìm kiếm toàn văn PostgreSQL, chưa dùng embeddings/vector search.</p>
      </section>
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      {searched && !busy && !error && results.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">Chưa tìm thấy tài liệu phù hợp trong kho tri thức đã xuất bản. Điều này không có nghĩa là không có kiến thức hoặc tài liệu liên quan ở nơi khác.</p> : null}
      <div className="space-y-4">
        {results.map((result) => <article key={`${result.documentId}-${result.excerpt.slice(0, 20)}`} className="card p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-moss-700"><span className="rounded-full bg-moss-50 px-2 py-1 font-semibold">{result.evidenceType}</span><span>Ngôn ngữ: {result.language.toUpperCase()}</span><span>Đã xác minh: {new Date(result.verifiedAt).toLocaleDateString()}</span></div>
          <h2 className="mt-2 text-lg font-bold text-ink">{result.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{result.summary}</p>
          <div className="mt-3 rounded-2xl bg-moss-50 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.excerpt}</p></div>
          <p className="mt-3 text-xs text-slate-500">Nguồn: {result.publisher}{result.authors.length ? ` · ${result.authors.join(', ')}` : ''}{result.publishedAt ? ` · Xuất bản: ${result.publishedAt}` : ''}</p>
          <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-semibold text-moss-700 underline">Mở tài liệu gốc ↗</a>
        </article>)}
      </div>
    </div>
  );
}
