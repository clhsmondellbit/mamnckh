'use client';

import Link from 'next/link';
import { useMemo, useSyncExternalStore, useState } from 'react';
import { filterResources } from '@/lib/resources/search';
import type { Resource, SupportTopic } from '@/lib/types';

const FAVORITES_STORAGE_KEY = 'mam-resource-favorites-v1';
const FAVORITES_CHANGE_EVENT = 'mam-resource-favorites-change';
const EMPTY_FAVORITES: string[] = [];
let favoriteSnapshot: string[] | null = null;

function readFavoriteSnapshot(): string[] {
  if (favoriteSnapshot) return favoriteSnapshot;
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    favoriteSnapshot = Array.isArray(parsed)
      ? Array.from(new Set(parsed.filter((value): value is string => typeof value === 'string'))).slice(0, 500)
      : [];
  } catch {
    favoriteSnapshot = [];
  }
  return favoriteSnapshot;
}

function subscribeToFavorites(onChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('storage', onChange);
  window.addEventListener(FAVORITES_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(FAVORITES_CHANGE_EVENT, onChange);
  };
}

function saveFavorites(ids: string[]) {
  favoriteSnapshot = Array.from(new Set(ids)).slice(0, 500);
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteSnapshot));
  } catch {
    // Private browsing or storage restrictions may disable local storage.
  }
  window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
}

function topicLabel(topic: SupportTopic) {
  return topic.replaceAll('_', ' ');
}

export function ResourceLibrary({ resources }: { resources: Resource[] }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<SupportTopic | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const favoriteIds = useSyncExternalStore(subscribeToFavorites, readFavoriteSnapshot, () => EMPTY_FAVORITES);

  const topics = useMemo(
    () => Array.from(new Set(resources.map((item) => item.topic))).sort(),
    [resources],
  );
  const filteredResources = useMemo(
    () => filterResources(resources, query, topic, favoritesOnly, favoriteIds),
    [resources, query, topic, favoritesOnly, favoriteIds],
  );

  function toggleFavorite(id: string) {
    saveFavorites(favoriteIds.includes(id)
      ? favoriteIds.filter((favoriteId) => favoriteId !== id)
      : [...favoriteIds, id]);
  }

  return (
    <section className="mt-8" aria-label="Thư viện tài nguyên học đường">
      <div className="card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] sm:items-end">
        <label className="block text-sm font-semibold text-ink">
          Tìm trong tài nguyên
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ví dụ: áp lực, bạn bè, mạng xã hội…"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal outline-none focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Lọc theo chủ đề
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value as SupportTopic | 'all')}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal outline-none focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
          >
            <option value="all">Tất cả chủ đề</option>
            {topics.map((item) => <option value={item} key={item}>{topicLabel(item)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(event) => setFavoritesOnly(event.target.checked)}
            className="size-4 accent-[#315a3e]"
          />
          Chỉ hiển thị nội dung đã lưu
        </label>
        <p className="text-xs text-slate-500 sm:col-span-2" aria-live="polite">
          {filteredResources.length} / {resources.length} tài nguyên. Nội dung đã lưu chỉ nằm trên thiết bị này.
        </p>
      </div>

      {filteredResources.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filteredResources.map((resource) => {
            const isFavorite = favoriteIds.includes(resource.id);
            return (
              <article key={resource.id} className={`card flex flex-col p-6 ${resource.isEmergency ? 'border-[#eab8b2] bg-[#fff7f5]' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[.15em] text-moss-700">
                    {resource.isEmergency ? 'Thông tin an toàn' : topicLabel(resource.topic)}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(resource.id)}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? `Bỏ lưu ${resource.title}` : `Lưu ${resource.title}`}
                    className="shrink-0 rounded-lg border border-moss-100 px-3 py-2 text-xs font-semibold text-moss-700 hover:bg-moss-50 focus-visible:outline-offset-2"
                  >
                    {isFavorite ? 'Đã lưu ✓' : 'Lưu nội dung'}
                  </button>
                </div>
                <h2 className="mt-3 text-xl font-bold text-ink">{resource.title}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{resource.summary}</p>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-700">{resource.content}</p>
                <p className="mt-4 text-[11px] text-slate-500">Cập nhật: {resource.updatedAt}</p>
                {resource.isEmergency ? (
                  <Link href="/help#urgent" className="button-danger mt-4 text-sm">Tìm người hỗ trợ</Link>
                ) : (
                  <Link href={`/chat?topic=${resource.topic}`} className="mt-4 inline-block font-bold text-moss-700 underline underline-offset-4">
                    Trao đổi về chủ đề này
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card mt-5 p-8 text-center" role="status">
          <h2 className="font-bold text-ink">Chưa tìm thấy nội dung phù hợp</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Thử từ khóa khác hoặc bỏ bớt bộ lọc để xem thêm tài nguyên.</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setTopic('all'); setFavoritesOnly(false); }}
            className="button-secondary mt-4 text-sm"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </section>
  );
}
