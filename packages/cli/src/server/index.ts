import { Hono, type Context, type Next } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_DIR } from '@spec-thought-align/shared';
import { readSpec, writeSpec, readStatus, writeStatus, writeResult } from '../storage/index.js';

let server: Server | null = null;
let currentPort = 0;

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getLogDir(): string {
  return path.join(process.cwd(), STORAGE_DIR, '.server-logs');
}

function writeRequestLog(entry: Record<string, unknown>): void {
  try {
    const logDir = getLogDir();
    ensureDir(logDir);
    const logPath = path.join(logDir, 'requests.log');
    const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n';
    fs.appendFileSync(logPath, line, 'utf-8');
  } catch {
    // 静默忽略 — 记录日志本身不应该影响功能
  }
}

function requestLogger(): (c: Context, next: Next) => Promise<void> {
  return async (c, next) => {
    const method = c.req.method;
    const url = c.req.url;
    process.stdout.write(`[server] ← ${method} ${url}\n`);
    await next();
    process.stdout.write(`[server] → ${method} ${url} ${c.res.status}\n`);
    writeRequestLog({ method, url, status: c.res.status });
  };
}

/** UI 构建产物路径 */
function getUiDistPath(): string {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));

  // 生产（打包后）：dist/index.js → ./ui
  const pkgPath = path.join(serverDir, 'ui');
  if (fs.existsSync(path.join(pkgPath, 'index.html'))) {
    return pkgPath;
  }

  // 开发（tsx 直接跑）：packages/cli/src/server/index.ts → ../../../ui/dist
  const devPath = path.resolve(serverDir, '..', '..', '..', 'ui', 'dist');
  return devPath;
}

/** 读取 index.html 并注入 taskId */
function serveUiPage(taskId: string): string {
  const indexPath = path.join(getUiDistPath(), 'index.html');
  if (!fs.existsSync(indexPath)) {
    return `<!DOCTYPE html><html><body><h1>UI 未构建</h1><p>请先运行: cd packages/ui && npx vite build</p></body></html>`;
  }
  const html = fs.readFileSync(indexPath, 'utf-8');
  return html.replace('</head>', `<script>window.TASK_ID="${taskId}";</script></head>`);
}

export async function ensureServer(requestedPort?: number): Promise<number> {
  if (server && currentPort > 0) {
    return currentPort;
  }

  const app = new Hono();
  const uiDistPath = getUiDistPath();

  app.use('*', requestLogger());

  // ---- API 路由（必须最先匹配） ----

  app.get('/api/task/:id', (c) => {
    const taskId = c.req.param('id');
    try {
      const spec = readSpec(taskId);
      const statusData = readStatus(taskId);
      return c.json({
        success: true,
        data: { ...spec, meta: { ...spec.meta, status: statusData.status } },
      });
    } catch (err) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }
  });

  app.post('/api/task/:id/spec', async (c) => {
    const taskId = c.req.param('id');
    try {
      const updates = await c.req.json();
      const spec = readSpec(taskId);
      for (const key of Object.keys(updates)) {
        if (key !== 'meta' && key !== 'input') {
          (spec as Record<string, unknown>)[key] = updates[key];
        }
      }
      writeSpec(taskId, spec);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ success: false, error: 'Failed to save spec' }, 500);
    }
  });

  app.post('/api/task/:id/confirm', (c) => {
    const taskId = c.req.param('id');
    process.stdout.write(`[server] CONFIRM handler reached for task ${taskId}\n`);
    try {
      writeStatus(taskId, 'confirmed');
      const spec = readSpec(taskId);
      spec.meta.status = 'confirmed';
      spec.meta.confirmedAt = new Date().toISOString();
      writeSpec(taskId, spec);
      writeResult(taskId, spec);
      process.stdout.write(`[server] CONFIRM done for task ${taskId}\n`);
      return c.json({ success: true, message: '已确认' });
    } catch (err) {
      process.stdout.write(`[server] CONFIRM error for task ${taskId}: ${String(err)}\n`);
      return c.json({ success: false, error: 'Failed to confirm task' }, 500);
    }
  });

  app.post('/api/task/:id/cancel', (c) => {
    const taskId = c.req.param('id');
    try {
      writeStatus(taskId, 'cancelled');
      return c.json({ success: true, message: '已取消' });
    } catch (err) {
      return c.json({ success: false, error: 'Failed to cancel task' }, 500);
    }
  });

  app.get('/api/tasks', (_c) => {
    try {
      const tasks = listAllTasks();
      return Response.json({ success: true, data: tasks });
    } catch (err) {
      return Response.json({ success: false, error: 'Failed to list tasks' }, { status: 500 });
    }
  });

  // ---- UI 页面入口 ----
  app.get('/task/:id', (c) => {
    const taskId = c.req.param('id');
    return c.html(serveUiPage(taskId));
  });

  // ---- 静态资源（仅 /assets/ 目录） ----
  if (fs.existsSync(uiDistPath)) {
    app.use('/assets/*', serveStatic({ root: uiDistPath }));
  }

  // 启动
  const port = requestedPort || 5678;
  return new Promise<number>((resolve, reject) => {
    const tryPort = (p: number) => {
      const s = serve({ fetch: app.fetch, port: p }, (info) => {
        currentPort = info.port;
        server = s as unknown as Server;
        resolve(info.port);
      });
      s.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && !requestedPort) {
          tryPort(p + 1);
        } else {
          reject(err);
        }
      });
    };
    tryPort(port);
  });
}

function listAllTasks(): unknown[] {
  const storagePath = path.join(process.cwd(), STORAGE_DIR);
  if (!fs.existsSync(storagePath)) return [];
  const entries = fs.readdirSync(storagePath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => {
      try {
        const spec = readSpec(e.name);
        const statusData = readStatus(e.name);
        return {
          id: e.name,
          status: statusData.status,
          goal: spec.understanding?.goal || '',
          createdAt: statusData.createdAt,
        };
      } catch {
        return { id: e.name, status: 'unknown', goal: '', createdAt: '' };
      }
    });
}

export function getServerPort(): number {
  return currentPort;
}
