import { describe, it, expect } from 'vitest';
import { createEmptySpec, STORAGE_DIR } from './constants.js';

describe('createEmptySpec', () => {
  it('creates a spec with correct meta', () => {
    const spec = createEmptySpec('test-001', '做个登录页', '假设用 React');
    expect(spec.meta.id).toBe('test-001');
    expect(spec.meta.status).toBe('pending');
    expect(spec.input.request).toBe('做个登录页');
    expect(spec.input.analysis).toBe('假设用 React');
  });

  it('initializes empty fields', () => {
    const spec = createEmptySpec('t1', 'r', 'a');
    expect(spec.understanding.goal).toBe('');
    expect(spec.scope.assumptions).toEqual([]);
    expect(spec.questions).toEqual([]);
    expect(spec.userAdditions.notes).toBe('');
  });

  it('sets agentType when provided', () => {
    const spec = createEmptySpec('t1', 'r', 'a', 'cline');
    expect(spec.meta.agentType).toBe('cline');
    expect(spec.input.meta.agentType).toBe('cline');
  });
});

describe('STORAGE_DIR', () => {
  it('is .spec-align', () => {
    expect(STORAGE_DIR).toBe('.spec-align');
  });
});
