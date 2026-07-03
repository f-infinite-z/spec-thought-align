// ---- ID 生成 ----

let counter = 0;

export function generateId(prefix = 'q'): string {
  counter += 1;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${ts}_${rand}_${counter}`;
}

// ---- 时间 ----

export function nowISO(): string {
  return new Date().toISOString();
}

// ---- 对象深拷贝 ----

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ---- 路径拼接 ----

export function joinPath(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/');
}
