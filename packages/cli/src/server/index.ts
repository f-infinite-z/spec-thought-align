import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_DIR } from '@spec-thought-align/shared';
import { readSpec, writeSpec, readStatus, writeStatus } from '../storage/index.js';

const server: Server | null = null;
let currentPort = 0;

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

  // ---- 静态文件（构建后的 UI JS/CSS） ----
  if (fs.existsSync(uiDistPath)) {
    app.use('/assets/*', serveStatic({ root: uiDistPath }));
    // 也支持不带 /assets 前缀的路径
    app.use('/*', serveStatic({ root: uiDistPath, rewriteRequestPath: (p) => p }));
  }

  // ---- UI 页面入口 ----
  app.get('/task/:id', (c) => {
    const taskId = c.req.param('id');
    return c.html(serveUiPage(taskId));
  });

  // ---- API 路由 ----

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
      console.error(`[server] GET /api/task/${taskId} error:`, err);
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
      console.error(`[server] POST /api/task/${taskId}/spec error:`, err);
      return c.json({ success: false, error: 'Failed to save spec' }, 500);
    }
  });

  app.post('/api/task/:id/confirm', (c) => {
    const taskId = c.req.param('id');
    try {
      writeStatus(taskId, 'confirmed');
      const spec = readSpec(taskId);
      spec.meta.status = 'confirmed';
      spec.meta.confirmedAt = new Date().toISOString();
      writeSpec(taskId, spec);
      return c.json({ success: true, message: '已确认' });
    } catch (err) {
      console.error(`[server] POST /api/task/${taskId}/confirm error:`, err);
      return c.json({ success: false, error: 'Failed to confirm task' }, 500);
    }
  });

  app.post('/api/task/:id/cancel', (c) => {
    const taskId = c.req.param('id');
    try {
      writeStatus(taskId, 'cancelled');
      return c.json({ success: true, message: '已取消' });
    } catch (err) {
      console.error(`[server] POST /api/task/${taskId}/cancel error:`, err);
      return c.json({ success: false, error: 'Failed to cancel task' }, 500);
    }
  });

  app.get('/api/tasks', (_c) => {
    try {
      const tasks = listAllTasks();
      return Response.json({ success: true, data: tasks });
    } catch (err) {
      console.error('[server] GET /api/tasks error:', err);
      return Response.json({ success: false, error: 'Failed to list tasks' }, { status: 500 });
    }
  });

  // 启动
  const port = requestedPort || 5678;
  return new Promise<number>((resolve, reject) => {
    const tryPort = (p: number) => {
      const s = serve({ fetch: app.fetch, port: p }, (info) => {
        currentPort = info.port;
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
    .filter((e) => e.isDirectory())
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
