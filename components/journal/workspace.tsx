'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Entry = {
  id: string;
  title: string;
  content: string;
  topic: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
};

const STORAGE_KEY = 'mam-private-journal-v1';
const prompts = [
  'Hôm nay điều gì khiến mình chú ý nhất?',
  'Có sự kiện nào mình muốn nhìn lại bình tĩnh hơn?',
  'Điều gì nằm trong khả năng kiểm soát của mình?',
  'Một điều nhỏ mình muốn thử vào ngày mai là gì?',
];

function parseEntries(value: unknown): Entry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): Entry[] => {
    if (!item || typeof item !== 'object') return [];
    const entry = item as Partial<Entry>;
    if (
      typeof entry.id !== 'string' ||
      typeof entry.title !== 'string' ||
      typeof entry.content !== 'string' ||
      typeof entry.topic !== 'string' ||
      typeof entry.createdAt !== 'string'
    ) return [];

    return [{
      id: entry.id,
      title: entry.title,
      content: entry.content,
      topic: entry.topic,
      tags: Array.isArray(entry.tags) ? entry.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 12) : [],
      createdAt: entry.createdAt,
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : undefined,
    }];
  });
}

export function JournalWorkspace() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('daily');
  const [tagsDraft, setTagsDraft] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(parseEntries(JSON.parse(raw) as unknown));
    } catch {
      setMessage('Không thể đọc nhật ký trên thiết bị này. Bạn có thể xuất dữ liệu trước khi xóa bộ nhớ trình duyệt.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      setMessage('Bộ nhớ trình duyệt không đủ; hãy xuất bản sao hoặc xóa bớt mục cũ.');
    }
  }, [entries, loaded]);

  const visible = useMemo(() => entries.filter((entry) =>
    `${entry.title} ${entry.content} ${entry.topic} ${entry.tags.join(' ')}`
      .toLocaleLowerCase('vi')
      .includes(query.toLocaleLowerCase('vi')),
  ), [entries, query]);

  function resetEditor() {
    setEditingEntryId(null);
    setTitle('');
    setContent('');
    setTopic('daily');
    setTagsDraft('');
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    const tags = [...new Set(tagsDraft.split(',').map((tag) => tag.trim()).filter(Boolean))].slice(0, 12);
    const now = new Date().toISOString();

    if (editingEntryId) {
      setEntries((current) => current.map((entry) => entry.id === editingEntryId
        ? { ...entry, title: title.trim() || 'Ghi chú của mình', content: trimmedContent, topic, tags, updatedAt: now }
        : entry));
      setMessage('Đã cập nhật ghi chú trên thiết bị này.');
    } else {
      setEntries((current) => [{
        id: crypto.randomUUID(),
        title: title.trim() || 'Ghi chú của mình',
        content: trimmedContent,
        topic,
        tags,
        createdAt: now,
      }, ...current]);
      setMessage('Đã lưu riêng trên trình duyệt của thiết bị này.');
    }
    resetEditor();
  }

  function edit(entry: Entry) {
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setTopic(entry.topic);
    setTagsDraft(entry.tags.join(', '));
    setMessage('Bạn đang chỉnh sửa một mục đã lưu.');
  }

  function remove(id: string) {
    if (!window.confirm('Xóa vĩnh viễn mục nhật ký này khỏi thiết bị?')) return;
    setEntries((current) => current.filter((entry) => entry.id !== id));
    if (editingEntryId === id) resetEditor();
    setMessage('Đã xóa mục nhật ký.');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'mam-private-journal.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={save} className="card p-5 sm:p-6">
        <h2 className="text-xl font-bold text-ink">{editingEntryId ? 'Chỉnh sửa ghi chú' : 'Viết một ghi chú riêng'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Nhật ký chỉ lưu trong bộ nhớ trình duyệt trên thiết bị hiện tại. Không gửi lên máy chủ và không tự động đưa vào ngữ cảnh AI.</p>
        <label className="mt-4 block text-sm font-semibold">Tiêu đề<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Một dòng để nhớ" /></label>
        <label className="mt-3 block text-sm font-semibold">Chủ đề<select value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="daily">Ghi chú hằng ngày</option><option value="study">Học tập</option><option value="friends">Bạn bè</option><option value="family">Gia đình</option><option value="feelings">Cảm xúc</option><option value="goals">Mục tiêu</option><option value="other">Khác</option></select></label>
        <label className="mt-3 block text-sm font-semibold">Thẻ, cách nhau bằng dấu phẩy<input value={tagsDraft} onChange={(event) => setTagsDraft(event.target.value)} maxLength={220} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Ví dụ: điều đáng nhớ, trường học…" /></label>
        <label className="mt-3 block text-sm font-semibold">Nội dung<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={7} maxLength={6000} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Bạn có thể viết tự do. Không cần phải viết hoàn hảo." /></label>
        <p className="mt-2 text-xs text-slate-500">Gợi ý tự phản tư:</p>
        <div className="mt-2 flex flex-wrap gap-2">{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => setContent((current) => current ? `${current}\n\n${prompt}\n` : `${prompt}\n`)} className="rounded-full bg-moss-50 px-3 py-2 text-left text-xs text-moss-700">{prompt}</button>)}</div>
        <div className="mt-4 flex flex-wrap gap-2"><button disabled={!loaded || !content.trim()} className="button-primary">{editingEntryId ? 'Lưu thay đổi' : 'Lưu trên thiết bị'}</button>{editingEntryId ? <button type="button" onClick={resetEditor} className="button-secondary">Hủy chỉnh sửa</button> : null}</div>
        {message ? <p role="status" className="mt-3 text-xs text-slate-600">{message}</p> : null}
      </form>

      <section className="space-y-4">
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold text-ink">Nhật ký của mình</h2><button type="button" className="button-secondary" disabled={entries.length === 0} onClick={exportData}>Xuất bản sao</button></div>
          <label className="mt-3 block text-sm font-semibold">Tìm trong nhật ký<input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Tìm theo từ khóa hoặc thẻ…" /></label>
        </div>
        {visible.length === 0 ? <div className="card p-6 text-sm leading-6 text-slate-600">{entries.length === 0 ? 'Chưa có ghi chú nào. Bạn có thể bắt đầu bằng một câu hỏi tự phản tư.' : 'Không tìm thấy mục phù hợp.'}</div> : visible.map((entry) => (
          <article key={entry.id} className="card p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-ink">{entry.title}</h3><p className="mt-1 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString('vi-VN')} · {entry.topic}{entry.updatedAt ? ' · Đã chỉnh sửa' : ''}</p></div><div className="flex gap-3"><button type="button" onClick={() => edit(entry)} className="text-sm font-semibold text-moss-700 underline">Sửa</button><button type="button" onClick={() => remove(entry.id)} className="text-sm font-semibold text-red-700 underline">Xóa</button></div></div>
            {entry.tags.length ? <div className="mt-2 flex flex-wrap gap-1.5">{entry.tags.map((tag) => <span key={tag} className="rounded-full bg-moss-50 px-2 py-1 text-[11px] text-moss-700">#{tag}</span>)}</div> : null}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{entry.content}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
