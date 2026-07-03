import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ensureTaskDir, writeInput, writeSpec, writeStatus, readStatus } from './index.js';
import { createEmptySpec } from '@spec-thought-align/shared';

describe('submit --wait polling', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-thought-align-wait-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects confirmed status after polling', async () => {
    const taskId = 'poll-test';
    const basePath = tmpDir;

    // Create task
    ensureTaskDir(taskId, basePath);
    writeInput(taskId, { request: 'test', analysis: 'test' }, basePath);
    const spec = createEmptySpec(taskId, 'test', 'test');
    writeSpec(taskId, spec, basePath);
    writeStatus(taskId, 'pending', basePath);

    // Confirm after 500ms
    setTimeout(() => {
      writeStatus(taskId, 'confirmed', basePath);
    }, 500);

    // Poll (simulate --wait logic)
    const startTime = Date.now();
    const timeout = 10000;
    let detected = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > timeout) break;

      const status = readStatus(taskId, basePath);
      if (status.status === 'confirmed') {
        detected = true;
        break;
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    expect(detected).toBe(true);
    expect((Date.now() - startTime) / 1000).toBeLessThan(2);
  });

  it('detects cancelled status', async () => {
    const taskId = 'cancel-test';
    const basePath = tmpDir;

    ensureTaskDir(taskId, basePath);
    writeInput(taskId, { request: 'test', analysis: 'test' }, basePath);
    const spec = createEmptySpec(taskId, 'test', 'test');
    writeSpec(taskId, spec, basePath);
    writeStatus(taskId, 'pending', basePath);

    // Cancel after 300ms
    setTimeout(() => {
      writeStatus(taskId, 'cancelled', basePath);
    }, 300);

    let detected = false;
    const startTime = Date.now();
    const timeout = 10000;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > timeout) break;

      const status = readStatus(taskId, basePath);
      if (status.status === 'cancelled') {
        detected = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    expect(detected).toBe(true);
  });

  it('times out when no status change', async () => {
    const taskId = 'timeout-test';
    const basePath = tmpDir;

    ensureTaskDir(taskId, basePath);
    writeInput(taskId, { request: 'test', analysis: 'test' }, basePath);
    const spec = createEmptySpec(taskId, 'test', 'test');
    writeSpec(taskId, spec, basePath);
    writeStatus(taskId, 'pending', basePath);

    const startTime = Date.now();
    const shortTimeout = 2000;
    let timedOut = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > shortTimeout / 1000) {
        timedOut = true;
        break;
      }

      const status = readStatus(taskId, basePath);
      if (status.status !== 'pending') break;

      await new Promise((r) => setTimeout(r, 200));
    }

    expect(timedOut).toBe(true);
  });
});
