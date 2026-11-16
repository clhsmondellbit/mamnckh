import { describe, expect, it } from 'vitest';
import { splitKnowledgeDocument } from '@/lib/knowledge/chunking';

describe('knowledge chunking', () => {
  it('returns no chunks for empty content', () => {
    expect(splitKnowledgeDocument('  ')).toEqual([]);
  });
  it('splits long content into bounded chunks and preserves text', () => {
    const source = `${'Một đoạn nội dung có ý nghĩa. '.repeat(80)}\n\n${'Đoạn thứ hai có thêm thông tin. '.repeat(70)}`;
    const chunks = splitKnowledgeDocument(source, 600, 80);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((chunk) => chunk.content.length <= 600)).toBe(true);
    expect(chunks.map((chunk) => chunk.index)).toEqual(chunks.map((_, index) => index));
    expect(chunks.map((chunk) => chunk.content).join(' ')).toContain('Đoạn thứ hai');
  });
  it('rejects unsafe chunk settings', () => {
    expect(() => splitKnowledgeDocument('text', 100, 10)).toThrow();
  });
});
