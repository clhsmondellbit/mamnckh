import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classifySafety } from '@/lib/safety/classify';
import { orchestrateSupportRequest } from '@/lib/ai/orchestrator';

type Case = { id: string; text: string; safety: 'green' | 'yellow' | 'red'; module: string };
const dataset = JSON.parse(readFileSync(resolve(process.cwd(), 'data/research/psychological-evaluation.json'), 'utf8')) as { cases: Case[] };

describe('MẦM synthetic psychological regression dataset', () => {
  it('contains a small, versioned synthetic dataset', () => {
    expect(dataset.cases.length).toBeGreaterThanOrEqual(8);
    expect(new Set(dataset.cases.map((item) => item.id)).size).toBe(dataset.cases.length);
  });

  for (const item of dataset.cases) {
    it(`${item.id}: deterministic safety label`, () => {
      expect(classifySafety(item.text).level).toBe(item.safety);
    });
    it(`${item.id}: orchestration module`, () => {
      expect(orchestrateSupportRequest(item.text).module).toBe(item.module);
    });
  }
});
