import { describe, it, expect } from 'vitest';
import { generateId, nowISO, joinPath } from './utils.js';

describe('generateId', () => {
  it('returns a string with prefix', () => {
    const id = generateId('q');
    expect(id).toMatch(/^q_/);
  });

  it('returns unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('nowISO', () => {
  it('returns ISO string', () => {
    const iso = nowISO();
    expect(() => new Date(iso)).not.toThrow();
    expect(iso).toContain('T');
  });
});

describe('joinPath', () => {
  it('joins parts with /', () => {
    expect(joinPath('.spec-thought-align', 'task-001')).toBe('.spec-thought-align/task-001');
    expect(joinPath('/a/', '/b/')).toBe('/a/b/');
  });
});
