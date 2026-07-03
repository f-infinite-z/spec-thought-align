declare global {
  interface Window {
    TASK_ID: string;
  }
}

export function getTaskId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || window.TASK_ID || '';
}

export function getFloatParam(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('float') === '1';
}

export function openFloatWindow(taskId: string) {
  const origin = window.location.origin;
  const path = window.location.pathname;
  window.open(
    `${origin}${path}?id=${taskId}&float=1`,
    'spec-thought-align-float',
    'width=820,height=920,left=40,top=40,toolbar=no,menubar=no,location=no,status=no,resizable=yes',
  );
}

export async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export function setByPath(obj: Record<string, any>, path: string, value: unknown) {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}
