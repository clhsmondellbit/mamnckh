import { describe, expect, it } from 'vitest';
import { filterResources, normalizeResourceSearch } from '@/lib/resources/search';
import type { Resource } from '@/lib/types';

const resources: Resource[] = [
  {
    id: 'study-1',
    title: 'Ứng phó với áp lực học tập',
    summary: 'Một số bước học tập lành mạnh',
    topic: 'study_pressure',
    content: 'Chia nhỏ nhiệm vụ và nghỉ ngắn.',
    audience: 'student',
    isEmergency: false,
    updatedAt: '2026-01-01',
  },
  {
    id: 'friends-1',
    title: 'Giao tiếp với bạn bè',
    summary: 'Lắng nghe và nói rõ nhu cầu',
    topic: 'friends',
    content: 'Trao đổi tôn trọng.',
    audience: 'student',
    isEmergency: false,
    updatedAt: '2026-01-01',
  },
];

describe('resource search', () => {
  it('normalizes Vietnamese accents and đ', () => {
    expect(normalizeResourceSearch('Điều chỉnh cảm xúc')).toBe('dieu chinh cam xuc');
    expect(filterResources(resources, 'ap luc hoc tap', 'all', false, [])).toHaveLength(1);
  });

  it('combines topic and favourites filters', () => {
    expect(filterResources(resources, '', 'friends', false, [])).toEqual([resources[1]]);
    expect(filterResources(resources, '', 'all', true, ['study-1'])).toEqual([resources[0]]);
  });
});
