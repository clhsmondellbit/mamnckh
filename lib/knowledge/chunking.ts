export type KnowledgeChunk = { index: number; content: string };

export function splitKnowledgeDocument(content: string, maxChars = 1200, overlapChars = 160): KnowledgeChunk[] {
  const normalized = content.replace(/\r\n?/g, '\n').replace(/[\t ]+/g, ' ').trim();
  if (!normalized) return [];
  if (maxChars < 300 || maxChars > 5000 || overlapChars < 0 || overlapChars >= maxChars) {
    throw new Error('Invalid knowledge chunk configuration');
  }

  const paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks: KnowledgeChunk[] = [];
  let current = '';

  const push = () => {
    const text = current.trim();
    if (text) chunks.push({ index: chunks.length, content: text });
    current = '';
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) push();
      let offset = 0;
      while (offset < paragraph.length) {
        const end = Math.min(offset + maxChars, paragraph.length);
        let boundary = end;
        if (end < paragraph.length) {
          const candidate = paragraph.lastIndexOf(' ', end);
          if (candidate > offset + Math.floor(maxChars * 0.6)) boundary = candidate;
        }
        chunks.push({ index: chunks.length, content: paragraph.slice(offset, boundary).trim() });
        if (boundary >= paragraph.length) break;
        offset = Math.max(offset + 1, boundary - overlapChars);
      }
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) current = candidate;
    else {
      push();
      current = paragraph;
    }
  }
  if (current) push();
  return chunks.filter((chunk) => chunk.content.length > 0);
}
