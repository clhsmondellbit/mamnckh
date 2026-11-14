import type { Resource, SupportTopic } from '@/lib/types';

export function normalizeResourceSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi-VN')
    .trim();
}

export function filterResources(
  items: Resource[],
  query: string,
  topic: SupportTopic | 'all',
  favoritesOnly: boolean,
  favoriteIds: string[],
): Resource[] {
  const normalizedQuery = normalizeResourceSearch(query);

  return items.filter((item) => {
    if (topic !== 'all' && item.topic !== topic) return false;
    if (favoritesOnly && !favoriteIds.includes(item.id)) return false;
    if (!normalizedQuery) return true;

    const searchable = normalizeResourceSearch([
      item.title,
      item.summary,
      item.content,
      item.topic.replaceAll('_', ' '),
    ].join(' '));
    return searchable.includes(normalizedQuery);
  });
}
