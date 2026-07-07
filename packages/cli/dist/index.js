#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// packages/shared/src/types.ts
var init_types = __esm({
  "packages/shared/src/types.ts"() {
    "use strict";
  }
});

// packages/shared/src/constants.ts
function createEmptySpec(id, request, analysis, agentType) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    meta: { id, timestamp: now, status: "pending", agentType },
    input: {
      meta: { id, timestamp: now, agentType },
      request,
      analysis
    },
    understanding: { goal: "", context: "", rawRequest: request },
    scope: { inScope: [], outOfScope: [], constraints: [], assumptions: [] },
    plan: { architecture: "", components: [], techStack: [] },
    io: { inputs: [], outputs: [], acceptanceCriteria: [] },
    questions: [],
    userAdditions: { notes: "", fieldEdits: [] }
  };
}
var DEFAULT_CONFIG, STORAGE_DIR, INPUT_FILE, SPEC_FILE, STATUS_FILE, TASKS_FILE, RESULT_FILE, EXIT_CODES, DEFAULT_TIMEOUT_SECONDS, POLL_INTERVAL_MS;
var init_constants = __esm({
  "packages/shared/src/constants.ts"() {
    "use strict";
    DEFAULT_CONFIG = {
      server: {
        port: 5678,
        host: "127.0.0.1"
      },
      storage: {
        path: ".spec-thought-align"
      },
      llm: {
        provider: "openai",
        enabled: false,
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini"
      },
      ui: {
        autoOpen: true
      }
    };
    STORAGE_DIR = ".spec-thought-align";
    INPUT_FILE = "input.json";
    SPEC_FILE = "spec.json";
    STATUS_FILE = "status.json";
    TASKS_FILE = "tasks.json";
    RESULT_FILE = "result.json";
    EXIT_CODES = {
      CONFIRMED: 0,
      TIMEOUT: 1,
      CANCELLED: 2,
      ERROR: 3
    };
    DEFAULT_TIMEOUT_SECONDS = 600;
    POLL_INTERVAL_MS = 1e3;
  }
});

// packages/shared/src/utils.ts
function generateId(prefix = "q") {
  counter += 1;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${ts}_${rand}_${counter}`;
}
var counter;
var init_utils = __esm({
  "packages/shared/src/utils.ts"() {
    "use strict";
    counter = 0;
  }
});

// packages/shared/src/index.ts
var init_src = __esm({
  "packages/shared/src/index.ts"() {
    "use strict";
    init_types();
    init_constants();
    init_utils();
  }
});

// packages/cli/src/storage/index.ts
var storage_exports = {};
__export(storage_exports, {
  ensureTaskDir: () => ensureTaskDir,
  getStorageBasePath: () => getStorageBasePath,
  getSubTaskStatus: () => getSubTaskStatus,
  listTasks: () => listTasks,
  readInput: () => readInput,
  readResult: () => readResult,
  readSpec: () => readSpec,
  readStatus: () => readStatus,
  readTaskManifest: () => readTaskManifest,
  taskExists: () => taskExists,
  updateSubTask: () => updateSubTask,
  writeInput: () => writeInput,
  writeResult: () => writeResult,
  writeSpec: () => writeSpec,
  writeStatus: () => writeStatus,
  writeTaskManifest: () => writeTaskManifest
});
import fs from "node:fs";
import path from "node:path";
function ensureTaskDir(taskId, basePath = ".") {
  const dir = path.join(basePath, STORAGE_DIR, taskId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function writeInput(taskId, input, basePath = ".") {
  const dir = ensureTaskDir(taskId, basePath);
  const filePath = path.join(dir, INPUT_FILE);
  const data = {
    request: input.request,
    analysis: input.analysis,
    agentType: input.agentType,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
function readInput(taskId, basePath = ".") {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, INPUT_FILE);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
function writeSpec(taskId, spec, basePath = ".") {
  const dir = ensureTaskDir(taskId, basePath);
  const filePath = path.join(dir, SPEC_FILE);
  fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), "utf-8");
}
function readSpec(taskId, basePath = ".") {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, SPEC_FILE);
  if (!fs.existsSync(filePath)) {
    throw new Error(`\u89C4\u7EA6\u4E0D\u5B58\u5728: ${taskId}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
function writeStatus(taskId, status, basePath = ".") {
  const dir = ensureTaskDir(taskId, basePath);
  const filePath = path.join(dir, STATUS_FILE);
  const prev = readStatus(taskId, basePath);
  const data = {
    status,
    createdAt: prev.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
function readStatus(taskId, basePath = ".") {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, STATUS_FILE);
  if (!fs.existsSync(filePath)) {
    return { status: "pending", createdAt: "", updatedAt: "" };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
function listTasks(basePath = ".") {
  const storageDir = path.join(basePath, STORAGE_DIR);
  if (!fs.existsSync(storageDir)) return [];
  const entries = fs.readdirSync(storageDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => {
    const statusData = readStatus(e.name, basePath);
    return {
      id: e.name,
      status: statusData.status,
      createdAt: statusData.createdAt
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function getStorageBasePath() {
  return process.cwd();
}
function taskExists(taskId, basePath = ".") {
  const dir = path.join(basePath, STORAGE_DIR, taskId);
  return fs.existsSync(dir);
}
function writeTaskManifest(taskId, manifest, basePath = ".") {
  const dir = ensureTaskDir(taskId, basePath);
  fs.writeFileSync(path.join(dir, TASKS_FILE), JSON.stringify(manifest, null, 2), "utf-8");
}
function readTaskManifest(taskId, basePath = ".") {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, TASKS_FILE);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
function updateSubTask(taskId, subId, update, basePath = ".") {
  const manifest = readTaskManifest(taskId, basePath);
  if (!manifest) throw new Error(`\u4EFB\u52A1\u6E05\u5355\u4E0D\u5B58\u5728: ${taskId}`);
  const idx = manifest.subtasks.findIndex((s) => s.id === subId);
  if (idx === -1) throw new Error(`\u5B50\u4EFB\u52A1\u4E0D\u5B58\u5728: ${subId}`);
  manifest.subtasks[idx] = { ...manifest.subtasks[idx], ...update };
  writeTaskManifest(taskId, manifest, basePath);
}
function writeResult(taskId, spec, basePath = ".") {
  const dir = ensureTaskDir(taskId, basePath);
  const filePath = path.join(dir, RESULT_FILE);
  fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), "utf-8");
}
function readResult(taskId, basePath = ".") {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, RESULT_FILE);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
function getSubTaskStatus(taskId, basePath = ".") {
  const manifest = readTaskManifest(taskId, basePath);
  if (!manifest) return [];
  return manifest.subtasks.map((s) => ({
    id: s.id,
    description: s.description,
    status: s.status,
    acceptanceCriteria: s.acceptanceCriteria,
    agentNote: s.agentNote,
    dependencies: s.dependencies
  }));
}
var init_storage = __esm({
  "packages/cli/src/storage/index.ts"() {
    "use strict";
    init_src();
  }
});

// packages/cli/src/index.ts
import { Command as Command15 } from "commander";

// packages/cli/src/commands/submit.ts
init_src();
init_storage();
import { Command } from "commander";
import chalk from "chalk";
import { spawn } from "child_process";
import http from "node:http";

// packages/cli/src/server/index.ts
init_src();
init_storage();
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs2 from "node:fs";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
var server = null;
var currentPort = 0;
function ensureDir(dirPath) {
  if (!fs2.existsSync(dirPath)) {
    fs2.mkdirSync(dirPath, { recursive: true });
  }
}
function getLogDir() {
  return path2.join(process.cwd(), STORAGE_DIR, ".server-logs");
}
function writeRequestLog(entry) {
  try {
    const logDir = getLogDir();
    ensureDir(logDir);
    const logPath = path2.join(logDir, "requests.log");
    const line = JSON.stringify({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...entry }) + "\n";
    fs2.appendFileSync(logPath, line, "utf-8");
  } catch {
  }
}
function requestLogger() {
  return async (c, next) => {
    const method = c.req.method;
    const url = c.req.url;
    process.stdout.write(`[server] \u2190 ${method} ${url}
`);
    await next();
    process.stdout.write(`[server] \u2192 ${method} ${url} ${c.res.status}
`);
    writeRequestLog({ method, url, status: c.res.status });
  };
}
function getUiDistPath() {
  const serverDir = path2.dirname(fileURLToPath(import.meta.url));
  const pkgPath = path2.join(serverDir, "ui");
  if (fs2.existsSync(path2.join(pkgPath, "index.html"))) {
    return pkgPath;
  }
  const devPath = path2.resolve(serverDir, "..", "..", "..", "ui", "dist");
  return devPath;
}
function serveUiPage(taskId) {
  const indexPath = path2.join(getUiDistPath(), "index.html");
  if (!fs2.existsSync(indexPath)) {
    return `<!DOCTYPE html><html><body><h1>UI \u672A\u6784\u5EFA</h1><p>\u8BF7\u5148\u8FD0\u884C: cd packages/ui && npx vite build</p></body></html>`;
  }
  const html = fs2.readFileSync(indexPath, "utf-8");
  return html.replace("</head>", `<script>window.TASK_ID="${taskId}";</script></head>`);
}
async function ensureServer(requestedPort) {
  if (server && currentPort > 0) {
    return currentPort;
  }
  const app = new Hono();
  const uiDistPath = getUiDistPath();
  app.use("*", requestLogger());
  app.get("/api/task/:id", (c) => {
    const taskId = c.req.param("id");
    try {
      const spec = readSpec(taskId);
      const statusData = readStatus(taskId);
      return c.json({
        success: true,
        data: { ...spec, meta: { ...spec.meta, status: statusData.status } }
      });
    } catch (err) {
      return c.json({ success: false, error: "Task not found" }, 404);
    }
  });
  app.post("/api/task/:id/spec", async (c) => {
    const taskId = c.req.param("id");
    try {
      const updates = await c.req.json();
      const spec = readSpec(taskId);
      for (const key of Object.keys(updates)) {
        if (key !== "meta" && key !== "input") {
          spec[key] = updates[key];
        }
      }
      writeSpec(taskId, spec);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ success: false, error: "Failed to save spec" }, 500);
    }
  });
  app.post("/api/task/:id/confirm", (c) => {
    const taskId = c.req.param("id");
    process.stdout.write(`[server] CONFIRM handler reached for task ${taskId}
`);
    try {
      writeStatus(taskId, "confirmed");
      const spec = readSpec(taskId);
      spec.meta.status = "confirmed";
      spec.meta.confirmedAt = (/* @__PURE__ */ new Date()).toISOString();
      writeSpec(taskId, spec);
      writeResult(taskId, spec);
      process.stdout.write(`[server] CONFIRM done for task ${taskId}
`);
      return c.json({ success: true, message: "\u5DF2\u786E\u8BA4" });
    } catch (err) {
      process.stdout.write(`[server] CONFIRM error for task ${taskId}: ${String(err)}
`);
      return c.json({ success: false, error: "Failed to confirm task" }, 500);
    }
  });
  app.post("/api/task/:id/cancel", (c) => {
    const taskId = c.req.param("id");
    try {
      writeStatus(taskId, "cancelled");
      return c.json({ success: true, message: "\u5DF2\u53D6\u6D88" });
    } catch (err) {
      return c.json({ success: false, error: "Failed to cancel task" }, 500);
    }
  });
  app.get("/api/tasks", (_c) => {
    try {
      const tasks = listAllTasks();
      return Response.json({ success: true, data: tasks });
    } catch (err) {
      return Response.json({ success: false, error: "Failed to list tasks" }, { status: 500 });
    }
  });
  app.get("/task/:id", (c) => {
    const taskId = c.req.param("id");
    return c.html(serveUiPage(taskId));
  });
  if (fs2.existsSync(uiDistPath)) {
    app.use("/assets/*", serveStatic({ root: uiDistPath }));
  }
  const port = requestedPort || 5678;
  return new Promise((resolve, reject) => {
    const tryPort = (p) => {
      const s = serve({ fetch: app.fetch, port: p }, (info) => {
        currentPort = info.port;
        server = s;
        resolve(info.port);
      });
      s.on("error", (err) => {
        if (err.code === "EADDRINUSE" && !requestedPort) {
          tryPort(p + 1);
        } else {
          reject(err);
        }
      });
    };
    tryPort(port);
  });
}
function listAllTasks() {
  const storagePath = path2.join(process.cwd(), STORAGE_DIR);
  if (!fs2.existsSync(storagePath)) return [];
  const entries = fs2.readdirSync(storagePath, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => {
    try {
      const spec = readSpec(e.name);
      const statusData = readStatus(e.name);
      return {
        id: e.name,
        status: statusData.status,
        goal: spec.understanding?.goal || "",
        createdAt: statusData.createdAt
      };
    } catch {
      return { id: e.name, status: "unknown", goal: "", createdAt: "" };
    }
  });
}

// packages/cli/src/utils/browser.ts
import { exec } from "node:child_process";
async function openBrowser(url) {
  const platform = process.platform;
  let command;
  if (platform === "win32") {
    command = `start "" "${url}"`;
  } else if (platform === "darwin") {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  return new Promise((resolve) => {
    exec(command, (err) => {
      if (err) {
        console.warn(`\u26A0\uFE0F  \u65E0\u6CD5\u81EA\u52A8\u6253\u5F00\u6D4F\u89C8\u5668\uFF0C\u8BF7\u624B\u52A8\u8BBF\u95EE: ${url}`);
      }
      resolve();
    });
  });
}

// packages/cli/src/utils/agent.ts
var PROFILES = {
  opencode: {
    id: "opencode",
    name: "opencode",
    knownForTimeout: false,
    recommendedStrategy: "wait"
  },
  "claude-code": {
    id: "claude-code",
    name: "Claude Code / OpenClaw",
    knownForTimeout: true,
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 120
  },
  cline: {
    id: "cline",
    name: "Cline (VS Code)",
    knownForTimeout: true,
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 300
  },
  cursor: {
    id: "cursor",
    name: "Cursor IDE",
    knownForTimeout: true,
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 300
  },
  aider: {
    id: "aider",
    name: "Aider",
    knownForTimeout: false,
    recommendedStrategy: "wait"
  }
};
var GENERIC_PROFILE = {
  id: "generic",
  name: "Unknown Agent",
  knownForTimeout: true,
  recommendedStrategy: "no-wait"
};
function resolveAgentProfile(explicitType) {
  if (explicitType && PROFILES[explicitType]) {
    return PROFILES[explicitType];
  }
  const envVars = Object.keys(process.env);
  if (envVars.some((k) => k.startsWith("OPENCODE_"))) return PROFILES.opencode;
  if (envVars.some((k) => k.startsWith("CLINE_"))) return PROFILES.cline;
  if (envVars.some((k) => k.startsWith("AIDER_"))) return PROFILES.aider;
  if (process.env.VSCODE_CWD || process.env.CURSOR_TRACE_ID) return PROFILES.cursor;
  return GENERIC_PROFILE;
}
function getFallbackMessage(profile, _taskId) {
  if (profile.knownForTimeout) {
    if (profile.knownTimeoutSeconds) {
      return `[spec-align] \u68C0\u6D4B\u5230 ${profile.name}\uFF0C\u5176 exec \u8D85\u65F6\u7EA6 ${profile.knownTimeoutSeconds}s\u3002
  \u4E3A\u786E\u4FDD\u6570\u636E\u4E0D\u4E22\u5931\uFF0C\u63A8\u8350\u4F7F\u7528 --no-wait \u6A21\u5F0F\u3002`;
    }
    return `[spec-align] \u68C0\u6D4B\u5230 ${profile.name}\uFF0C\u8BE5 Agent \u53EF\u80FD\u6709 exec \u8D85\u65F6\u3002
  \u63A8\u8350\u4F7F\u7528 --no-wait \u6A21\u5F0F\uFF0C\u7136\u540E\u901A\u8FC7 await-confirm \u83B7\u53D6\u7ED3\u679C\u3002`;
  }
  return `[spec-align] \u68C0\u6D4B\u5230 ${profile.name}\u3002`;
}
function getReconnectHint(taskId, panelUrl) {
  const lines = [
    ``,
    `  \u82E5\u6B64\u8FDB\u7A0B\u56E0\u8D85\u65F6\u88AB\u7EC8\u6B62\uFF0C\u53EF\u901A\u8FC7\u4EE5\u4E0B\u65B9\u5F0F\u83B7\u53D6\u7ED3\u679C\uFF1A`,
    `  \u65B9\u5F0F1: spec-thought-align await-confirm --id "${taskId}"`,
    `  \u65B9\u5F0F2: \u76F4\u63A5\u8BFB\u53D6\u6587\u4EF6 .spec-thought-align/${taskId}/spec.json`,
    `  \u9762\u677F:   ${panelUrl}`
  ];
  return lines.join("\n");
}

// packages/cli/src/engine/parser.ts
init_src();
function normalizeAnalysis(text) {
  return text.replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
var SUB_CLAUSE_SPLITTERS = /(以及|还有|另外|此外|同时|并且|再者|进而)\s*/;
var ALTERNATIVE_SPLITTERS = /\s*(?:还是|或|或者)\s*/;
function splitCompoundText(text) {
  const parts = text.split(SUB_CLAUSE_SPLITTERS);
  const result = [];
  let current = "";
  for (const part of parts) {
    if (SUB_CLAUSE_SPLITTERS.test(part + " ")) {
      if (current.trim()) result.push(current.trim());
      current = "";
    } else {
      current += part;
    }
  }
  if (current.trim()) result.push(current.trim());
  if (result.length <= 1) return [text];
  return result.filter((p) => p.length > 2);
}
function splitAlternatives(text) {
  if (text.length < 60) return [text];
  const parts = text.split(ALTERNATIVE_SPLITTERS).filter((p) => p.trim().length > 0);
  if (parts.length <= 1) return [text];
  const baseQuestion = extractQuestionStem(parts[0]);
  if (!baseQuestion) return [text];
  const options = [parts[0].trim()];
  for (let i = 1; i < parts.length; i++) {
    options.push(baseQuestion + parts[i].trim());
  }
  return options.filter((o) => o.length > 3);
}
function extractQuestionStem(firstPart) {
  const words = firstPart.split(/\s+/);
  if (words.length < 2) return null;
  const lastWord = words[words.length - 1];
  if (lastWord.length <= 2) return words.slice(0, -1).join(" ") + " ";
  if (lastWord.endsWith("\u7528") || lastWord.endsWith("\u505A") || lastWord.endsWith("\u8981") || lastWord.endsWith("\u9009")) {
    return words.slice(0, -1).join(" ") + " ";
  }
  return null;
}
function parseAnalysis(analysis, request) {
  const normalized = normalizeAnalysis(analysis);
  const segments = splitIntoSegments(normalized);
  const result = {
    goal: "",
    context: "",
    assumptions: [],
    questions: [],
    techStack: [],
    inScope: [],
    outOfScope: [],
    constraints: [],
    architecture: "",
    components: [],
    acceptanceCriteria: []
  };
  result.goal = extractGoal(segments, request);
  result.context = extractContext(segments);
  for (const seg of segments) {
    const techs = extractTechStack(seg.text);
    for (const t of techs) {
      if (!result.techStack.includes(t)) result.techStack.push(t);
    }
  }
  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;
    if (isSectionHeader(text)) continue;
    if (isOutOfScope(text)) {
      result.outOfScope.push(cleanScope(text));
      continue;
    }
    if (isConstraint(text)) {
      result.constraints.push(cleanScope(text));
      continue;
    }
    if (isUncertaintyMarker(text)) {
      const cleaned = cleanUncertainty(text);
      const subClauses = splitCompoundText(cleaned);
      for (const sub of subClauses) {
        if (sub.length < 3) continue;
        result.questions.push({
          id: generateId("q"),
          question: sub,
          importance: "critical"
        });
        result.assumptions.push({
          id: generateId("a"),
          text: sub,
          confidence: "low",
          needsConfirmation: true
        });
      }
      continue;
    }
    if (text.endsWith("\uFF1F") || text.endsWith("?")) {
      const cleaned = text.replace(/[？?]+$/, "").trim();
      if (cleaned.length > 1) {
        const subClauses = splitCompoundText(cleaned);
        for (const sub of subClauses) {
          if (sub.length < 3) continue;
          const subAlternatives = splitAlternatives(sub);
          for (const sa of subAlternatives) {
            result.questions.push({
              id: generateId("q"),
              question: sa.endsWith("\uFF1F") ? sa.slice(0, -1) : sa,
              importance: "important"
            });
          }
        }
      }
      continue;
    }
    const assumption = detectExplicitAssumption(text);
    if (assumption) {
      result.assumptions.push(assumption);
      if (text.length > 3) result.inScope.push(text);
      continue;
    }
    if (hasModerateConfidence(text)) {
      result.assumptions.push({
        id: generateId("a"),
        text,
        confidence: "medium",
        needsConfirmation: true
      });
      if (!result.inScope.includes(text)) result.inScope.push(text);
      continue;
    }
    const techHits = extractTechStack(text);
    if (techHits.length > 0 && text.length > 5) {
      result.assumptions.push({
        id: generateId("a"),
        text,
        confidence: "medium",
        needsConfirmation: true
      });
    }
    if (isAcceptanceCriterion(text)) {
      result.acceptanceCriteria.push(text);
    }
    if (seg.type === "item" && text.length > 3 && !seg.isHeader) {
      if (!result.inScope.includes(text)) {
        result.inScope.push(text);
      }
    }
  }
  result.questions = mergeFragmentedQuestions(result.questions);
  result.assumptions = result.assumptions.filter(
    (a) => a.text.length > 3 && !isSectionHeader(a.text)
  );
  if (!result.goal && segments.length > 0) {
    result.goal = segments[0].text;
  }
  return result;
}
var HEADER_REGEX = new RegExp("^#{1,4}\\s+(.+)");
var NUM_REGEX = new RegExp("^(\\d+)[.\\)]\\s*(.+)");
var BULLET_REGEX = new RegExp("^[-*\u2022]\\s+(.+)");
function splitSentences(text) {
  const parts = text.split(/(?<=[。！？?])\s*/);
  return parts.filter((p) => p.trim().length > 0);
}
function splitIntoSegments(text) {
  const lines = text.split("\n");
  const segments = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const sentences = splitSentences(trimmed);
    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;
      const headerMatch = s.match(HEADER_REGEX);
      if (headerMatch) {
        segments.push({ text: headerMatch[1], type: "header", isHeader: true });
        continue;
      }
      const numMatch = s.match(NUM_REGEX);
      if (numMatch) {
        segments.push({ text: numMatch[2], type: "item", isHeader: false, number: numMatch[1] });
        continue;
      }
      const bulletMatch = s.match(BULLET_REGEX);
      if (bulletMatch) {
        segments.push({ text: bulletMatch[1], type: "item", isHeader: false });
        continue;
      }
      segments.push({ text: s, type: "paragraph", isHeader: false });
    }
  }
  return segments;
}
var PAREN_WRAPPED_REGEX = new RegExp("^[\uFF08(].+[\uFF09)]$");
var SECTION_HEADER_REGEX = new RegExp(
  "^(\u4E0D\u786E\u5B9A|\u6280\u672F\u65B9\u6848|\u4E0D\u505A|\u9ED8\u8BA4\u5047\u8BBE|\u9700\u8981\u786E\u8BA4|\u4EE5\u4E0B|\u7406\u89E3\u9700\u8981)[\u7684\uFF1A:\\s]*$"
);
var I_UNDERSTAND_REGEX = new RegExp("^\u6211\u7406\u89E3");
var UNCERTAIN_COLON_REGEX = new RegExp("^\u4E0D\u786E\u5B9A[\uFF1A:]\\s*(.+)");
var UNCERTAIN_SPACE_REGEX = new RegExp("^\u4E0D\u786E\u5B9A\\s*(.+)");
var UNCLEAR_REGEX = new RegExp("^\u4E0D\u6E05\u695A[\uFF1A:]\\s*(.+)");
var WE_UNCERTAIN_REGEX = new RegExp("^[\u6211\u6211\u4EEC]?\u4E0D\u786E\u5B9A");
var PREFIX_UNCERTAIN = new RegExp("^\u4E0D\u786E\u5B9A[\uFF1A:\\s]*");
var PREFIX_UNCLEAR = new RegExp("^\u4E0D\u6E05\u695A[\uFF1A:\\s]*");
var PREFIX_UNKNOWN = new RegExp("^\u4E0D\u77E5\u9053[\uFF1A:\\s]*");
var PREFIX_WE_UNCERTAIN = new RegExp("^[\u6211\u6211\u4EEC]\u4E0D\u786E\u5B9A[\uFF1A:\\s]*");
function isSectionHeader(text) {
  const t = text.trim();
  if (t.length <= 20 && (t.endsWith("\uFF1A") || t.endsWith(":"))) return true;
  if (PAREN_WRAPPED_REGEX.test(t) && t.length <= 15) return true;
  if (SECTION_HEADER_REGEX.test(t)) return true;
  if (I_UNDERSTAND_REGEX.test(t) && t.length <= 15) return true;
  return false;
}
function isUncertaintyMarker(text) {
  const t = text.trim();
  if (UNCERTAIN_COLON_REGEX.test(t)) return true;
  if (UNCERTAIN_SPACE_REGEX.test(t) && t.length > 6) return true;
  if (UNCLEAR_REGEX.test(t)) return true;
  if (WE_UNCERTAIN_REGEX.test(t) && t.length > 10) return true;
  return false;
}
function cleanUncertainty(text) {
  return text.replace(PREFIX_UNCERTAIN, "").replace(PREFIX_UNCLEAR, "").replace(PREFIX_UNKNOWN, "").replace(PREFIX_WE_UNCERTAIN, "").trim();
}
function mergeFragmentedQuestions(questions) {
  const merged = [];
  const fragmentStart = /^[/、，,]|^或[者]?|^还是|^以及|^还有|^并且|^同时|^另外|^此外|^进而/;
  for (const q of questions) {
    const isFragment = fragmentStart.test(q.question);
    if (isFragment && merged.length > 0) {
      merged[merged.length - 1].question += "\uFF1B" + q.question;
    } else {
      merged.push({ ...q });
    }
  }
  return merged;
}
var GOAL_PATTERNS = [
  new RegExp("\u6838\u5FC3[\u76EE\u6807\u662F\u8981\u505A\u52A1\u6C42]{1,2}[\u662F\u4E3A\uFF1A:]\\s*(.+)"),
  new RegExp("\u76EE\u6807[\u662F\u4E3A\uFF1A:]\\s*(.+)"),
  new RegExp("\u8981\u505A[\u7684\u662F\uFF1A:]\\s*(.+)"),
  new RegExp("\u9700\u8981?[\u5B9E\u73B0\u6784\u5EFA\u5F00\u53D1\u505A][\u7684\u662F]?\\s*(.+)"),
  new RegExp("\u4EFB\u52A1[\u662F\u4E3A\uFF1A:]\\s*(.+)")
];
function extractGoal(segments, request) {
  for (const seg of segments) {
    for (const pattern of GOAL_PATTERNS) {
      const match = seg.text.match(pattern);
      if (match) {
        const goal = match[1].trim();
        if (goal.length > 3) return goal;
      }
    }
  }
  const firstPara = segments.find(
    (s) => !s.isHeader && s.text.length > 8 && !/^\d+[.)、]\s*/.test(s.text) && !/^(以下|方案|根因|实际|例如|故|所谓)/.test(s.text) && !s.text.endsWith("\uFF1A") && !s.text.endsWith(":")
  );
  if (firstPara && firstPara.text.length > 5) {
    return firstPara.text.length > 80 ? firstPara.text.slice(0, 80) + "..." : firstPara.text;
  }
  return request || "";
}
function extractContext(segments) {
  const contextParts = segments.filter(
    (s) => s.type === "paragraph" && !s.isHeader && s.text.length > 10 && !isSectionHeader(s.text) && !s.text.endsWith("\uFF1F") && !s.text.endsWith("?") && !/^[/、，,•·]/.test(s.text) && !/^(或[者]?|还是|还有|以及)/.test(s.text)
  ).slice(0, 3).map((s) => s.text);
  return contextParts.join("\uFF1B");
}
var ASSUMPTION_PATTERNS = [
  new RegExp("^\u5047\u8BBE[\uFF1A:]?\\s*(.+)"),
  new RegExp("^[\u6211\u6211\u4EEC]\u5047\u8BBE(.+)"),
  new RegExp("^\u731C\u6D4B[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u4F30\u8BA1[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u9ED8\u8BA4[\uFF1A:]?\\s*(.+)")
];
function detectExplicitAssumption(text) {
  for (const pattern of ASSUMPTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const content = (match[1] || match[0]).trim();
      if (content.length < 3) continue;
      return {
        id: generateId("a"),
        text: content,
        confidence: detectConfidence(content),
        needsConfirmation: detectConfidence(content) !== "high"
      };
    }
  }
  return null;
}
function detectConfidence(text) {
  const lower = text.toLowerCase();
  if (HIGH_CONFIDENCE_WORDS.some((w) => lower.includes(w))) return "high";
  if (LOW_CONFIDENCE_WORDS.some((w) => lower.includes(w))) return "low";
  if (lower.includes("\u53EF\u80FD") || lower.includes("\u5E94\u8BE5") || lower.includes("\u901A\u5E38") || lower.includes("\u4E00\u822C"))
    return "medium";
  return "medium";
}
var HIGH_CONFIDENCE_WORDS = ["\u80AF\u5B9A", "\u786E\u5B9A", "\u663E\u7136", "\u5C31\u662F", "\u5DF2\u7ECF", "\u4E00\u5B9A"];
var LOW_CONFIDENCE_WORDS = [
  "\u4E0D\u786E\u5B9A",
  "\u4E0D\u6E05\u695A",
  "\u6CA1\u63D0\u5230",
  "\u6CA1\u8BF4",
  "\u4E5F\u8BB8",
  "\u53EF\u80FD\u5427",
  "\u4E0D\u77E5\u9053",
  "\u731C\u6D4B",
  "\u5927\u6982",
  "\u4F30\u8BA1"
];
function hasModerateConfidence(text) {
  const lower = text.toLowerCase();
  return ["\u53EF\u80FD", "\u5E94\u8BE5", "\u901A\u5E38", "\u4E00\u822C", "\u5927\u6982", "\u4F30\u8BA1"].some((w) => lower.includes(w));
}
var TECH_KEYWORDS = [
  "React",
  "Vue",
  "Angular",
  "Svelte",
  "Next.js",
  "Nuxt",
  "SvelteKit",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "Koa",
  "Hono",
  "Fastify",
  "Tailwind",
  "Bootstrap",
  "Material UI",
  "Ant Design",
  "shadcn",
  "Prisma",
  "Drizzle",
  "Sequelize",
  "TypeORM",
  "Mongoose",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "SQLite",
  "Redis",
  "JWT",
  "OAuth",
  "Passport",
  "NextAuth",
  "Docker",
  "Kubernetes",
  "Vite",
  "Webpack",
  "Zustand",
  "Redux",
  "Pinia",
  "React Hook Form",
  "Formik",
  "tRPC",
  "GraphQL",
  "REST",
  "gRPC",
  "React Router",
  "Markdown",
  "pnpm",
  "npm",
  "yarn"
];
function extractTechStack(text) {
  const found = [];
  for (const tech of TECH_KEYWORDS) {
    if (text.toLowerCase().includes(tech.toLowerCase())) {
      found.push(tech);
    }
  }
  return found;
}
var OUT_OF_SCOPE_PATTERNS = [
  new RegExp("^\u4E0D\u9700\u8981[\u505A]?\\s*(.+)"),
  new RegExp("^\u4E0D\u5305\u62EC[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u4E0D\u505A[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u4E0D\u7528[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u4E0D\u8003\u8651[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u6682[\u65F6\u4E0D]?\\s*(.+)")
];
var CONSTRAINT_PATTERNS = [
  new RegExp("^\u5FC5\u987B[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u4E0D\u80FD[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u9650\u5236[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u8981\u6C42[\uFF1A:]?\\s*(.+)"),
  new RegExp("^\u53EA\u80FD[\uFF1A:]?\\s*(.+)")
];
function isOutOfScope(text) {
  return OUT_OF_SCOPE_PATTERNS.some((p) => p.test(text));
}
function isConstraint(text) {
  return CONSTRAINT_PATTERNS.some((p) => p.test(text));
}
function isAcceptanceCriterion(text) {
  const lower = text.toLowerCase();
  return lower.includes("\u9A8C\u6536") || lower.includes("\u6D4B\u8BD5\u7528\u4F8B") || lower.includes("\u9884\u671F\u7ED3\u679C") || lower.includes("\u5E94\u8BE5\u80FD") || lower.includes("\u5FC5\u987B\u80FD");
}
function cleanScope(text) {
  for (const pattern of [...OUT_OF_SCOPE_PATTERNS, ...CONSTRAINT_PATTERNS]) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1]?.trim();
      if (cleaned && cleaned.length > 1) return cleaned;
    }
  }
  return text;
}
function fillSpecFromAnalysis(spec, _request) {
  const parsed = parseAnalysis(spec.input.analysis);
  if (!spec.understanding.goal && parsed.goal) spec.understanding.goal = parsed.goal;
  if (!spec.understanding.context && parsed.context) spec.understanding.context = parsed.context;
  if (spec.scope.assumptions.length === 0) spec.scope.assumptions = parsed.assumptions;
  if (spec.scope.inScope.length === 0) spec.scope.inScope = parsed.inScope;
  if (spec.scope.outOfScope.length === 0) spec.scope.outOfScope = parsed.outOfScope;
  if (spec.scope.constraints.length === 0) spec.scope.constraints = parsed.constraints;
  if (spec.questions.length === 0) spec.questions = parsed.questions;
  if (spec.plan.techStack.length === 0) spec.plan.techStack = parsed.techStack;
  if (!spec.plan.architecture && parsed.architecture) spec.plan.architecture = parsed.architecture;
  if (spec.io.acceptanceCriteria.length === 0)
    spec.io.acceptanceCriteria = parsed.acceptanceCriteria;
  return spec;
}

// packages/cli/src/commands/submit.ts
function waitForServer(port, timeoutMs = 1e4) {
  const start = Date.now();
  return new Promise((resolve) => {
    function check() {
      const req = http.get(`http://localhost:${port}/api/tasks`, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, 300);
        }
      });
      req.setTimeout(1e3, () => {
        req.destroy();
        if (Date.now() - start > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, 300);
        }
      });
    }
    check();
  });
}
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/tasks`, (res) => {
      res.resume();
      resolve(false);
    });
    req.on("error", () => {
      resolve(true);
    });
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(true);
    });
  });
}
function startDetachedServer(port) {
  const cliPath = process.argv[1];
  const child = spawn(process.execPath, [cliPath, "__serve", "--port", String(port)], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  child.unref();
}
async function runSubmit(options) {
  const {
    id: taskId,
    request,
    analysis,
    wait: shouldWait = true,
    timeout: timeoutStr = String(DEFAULT_TIMEOUT_SECONDS),
    port: portStr,
    agentType
  } = options;
  const timeout = parseInt(timeoutStr, 10);
  const requestedPort = portStr ? parseInt(portStr, 10) : 5678;
  const basePath = getStorageBasePath();
  const agentProfile = resolveAgentProfile(agentType);
  console.log(chalk.gray(getFallbackMessage(agentProfile, taskId)));
  console.log(chalk.blue(`
\u{1F4CB} Spec-Align: ${taskId}`));
  console.log(chalk.gray(`  \u5199\u5165\u539F\u59CB\u5206\u6790...`));
  writeInput(taskId, { request, analysis, agentType: agentProfile.id }, basePath);
  console.log(chalk.gray(`  \u521B\u5EFA\u7ED3\u6784\u5316\u89C4\u7EA6...`));
  const spec = createEmptySpec(taskId, request, analysis, agentType);
  console.log(chalk.gray(`  \u89C4\u5219\u5F15\u64CE\u89E3\u6790\u4E2D...`));
  fillSpecFromAnalysis(spec);
  writeSpec(taskId, spec, basePath);
  writeStatus(taskId, "pending", basePath);
  let serverPort;
  if (!shouldWait) {
    const available = await isPortAvailable(requestedPort);
    if (available) {
      startDetachedServer(requestedPort);
      const ready = await waitForServer(requestedPort, 8e3);
      if (!ready) {
        console.log(chalk.red(`
\u274C Server \u542F\u52A8\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u8FD0\u884C:`));
        console.log(chalk.gray(`   node ... __serve --port ${requestedPort}`));
        process.exit(1);
      }
    }
    serverPort = requestedPort;
  } else {
    serverPort = await ensureServer(requestedPort);
  }
  const panelUrl = `http://localhost:${serverPort}/task/${taskId}`;
  console.log(chalk.green(`
\u2705 \u89C4\u7EA6\u5DF2\u521B\u5EFA: ${taskId}`));
  console.log(chalk.cyan(`\u{1F310} \u53EF\u89C6\u5316\u9762\u677F: ${panelUrl}`));
  await openBrowser(panelUrl);
  if (!shouldWait) {
    console.log(chalk.gray(`
\u23E9 Server \u5DF2\u542F\u52A8\uFF08--no-wait \u6A21\u5F0F\uFF09`));
    console.log(chalk.gray(`   \u9762\u677F: ${panelUrl}`));
    if (agentProfile.knownForTimeout) {
      console.log(chalk.yellow(getReconnectHint(taskId, panelUrl)));
    }
    return;
  }
  console.log(chalk.yellow(`
\u23F3 \u7B49\u5F85\u7528\u6237\u786E\u8BA4... (\u8D85\u65F6: ${timeout}s)`));
  if (agentProfile.knownForTimeout) {
    console.log(chalk.gray(getReconnectHint(taskId, panelUrl)));
  }
  const startTime = Date.now();
  let lastStatus = "pending";
  while (true) {
    const elapsed = (Date.now() - startTime) / 1e3;
    if (elapsed > timeout) {
      console.log(chalk.red(`
\u23F1\uFE0F  \u7B49\u5F85\u8D85\u65F6 (${timeout}s)`));
      writeStatus(taskId, "cancelled", basePath);
      process.exit(EXIT_CODES.TIMEOUT);
    }
    try {
      const statusData = readStatus(taskId, basePath);
      const currentStatus = statusData.status;
      if (currentStatus === "confirmed") {
        const finalSpec = readSpec(taskId, basePath);
        writeResult(taskId, finalSpec, basePath);
        console.log(chalk.green(`
\u2705 \u7528\u6237\u5DF2\u786E\u8BA4\u89C4\u7EA6\uFF01`));
        console.log(JSON.stringify(finalSpec, null, 2));
        console.log(chalk.gray(`
\u{1F550} Server \u5C06\u5728 10 \u79D2\u540E\u5173\u95ED\uFF0C\u6B64\u671F\u95F4\u4ECD\u53EF\u8BBF\u95EE\u9762\u677F\u67E5\u770B\u7ED3\u679C`));
        setTimeout(() => process.exit(EXIT_CODES.CONFIRMED), 1e4);
        return;
      }
      if (currentStatus === "cancelled") {
        console.log(chalk.red(`
\u274C \u7528\u6237\u5DF2\u53D6\u6D88`));
        console.log(chalk.gray(`
\u{1F550} Server \u5C06\u5728 5 \u79D2\u540E\u5173\u95ED`));
        setTimeout(() => process.exit(EXIT_CODES.CANCELLED), 5e3);
        return;
      }
      if (currentStatus !== lastStatus) {
        lastStatus = currentStatus;
      }
    } catch {
    }
    await sleep(POLL_INTERVAL_MS);
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function createSubmitCommand() {
  return new Command("submit").description("\u63D0\u4EA4\u9700\u6C42\u89C4\u7EA6\u5E76\u7B49\u5F85\u7528\u6237\u786E\u8BA4").requiredOption("--id <id>", "\u4EFB\u52A1\u552F\u4E00\u6807\u8BC6").requiredOption("--request <text>", "\u7528\u6237\u539F\u59CB\u9700\u6C42").requiredOption("--analysis <text>", "Agent \u7684\u601D\u8003\u5206\u6790").option("--wait", "\u963B\u585E\u7B49\u5F85\u7528\u6237\u786E\u8BA4", true).option("--no-wait", "\u7ACB\u5373\u8FD4\u56DE\uFF0C\u4E0D\u7B49\u5F85").option("--timeout <seconds>", "\u8D85\u65F6\u79D2\u6570", String(DEFAULT_TIMEOUT_SECONDS)).option("--port <port>", "\u6307\u5B9A HTTP Server \u7AEF\u53E3").option("--agent-type <type>", "\u6765\u6E90 Agent \u7C7B\u578B (cline/cursor/aider/...)").action(async (options) => {
    await runSubmit(options);
  });
}

// packages/cli/src/commands/fetch.ts
init_storage();
import { Command as Command2 } from "commander";
import chalk2 from "chalk";
function createFetchCommand() {
  return new Command2("fetch").description("\u62C9\u53D6\u5DF2\u786E\u8BA4\u7684\u89C4\u7EA6").requiredOption("--id <id>", "\u4EFB\u52A1 ID").option("--format <format>", "\u8F93\u51FA\u683C\u5F0F (json|summary)", "json").action(async (options) => {
    const { id: taskId, format } = options;
    const basePath = getStorageBasePath();
    if (!taskExists(taskId, basePath)) {
      console.error(chalk2.red(`\u274C \u4EFB\u52A1\u4E0D\u5B58\u5728: ${taskId}`));
      process.exit(3);
    }
    try {
      const spec = readSpec(taskId, basePath);
      if (format === "summary") {
        console.log(chalk2.blue(`
\u{1F4CB} ${taskId}`));
        console.log(chalk2.gray(`  \u72B6\u6001: ${spec.meta.status}`));
        console.log(chalk2.gray(`  \u76EE\u6807: ${spec.understanding.goal || "(\u672A\u586B\u5199)"}`));
        console.log(chalk2.gray(`  In Scope: ${spec.scope.inScope.length} \u9879`));
        console.log(chalk2.gray(`  \u5047\u8BBE: ${spec.scope.assumptions.length} \u9879`));
        console.log(chalk2.gray(`  \u95EE\u9898: ${spec.questions.length} \u9879`));
      } else {
        console.log(JSON.stringify(spec, null, 2));
      }
    } catch (err) {
      console.error(chalk2.red(`\u274C \u8BFB\u53D6\u5931\u8D25: ${err}`));
      process.exit(3);
    }
  });
}

// packages/cli/src/commands/status.ts
init_storage();
import { Command as Command3 } from "commander";
function createStatusCommand() {
  return new Command3("status").description("\u67E5\u8BE2\u4EFB\u52A1\u72B6\u6001").requiredOption("--id <id>", "\u4EFB\u52A1 ID").action(async (options) => {
    const taskId = options.id;
    const basePath = getStorageBasePath();
    if (!taskExists(taskId, basePath)) {
      console.log(JSON.stringify({ status: "not_found", id: taskId }));
      process.exit(3);
    }
    const statusData = readStatus(taskId, basePath);
    console.log(
      JSON.stringify({
        id: taskId,
        status: statusData.status,
        createdAt: statusData.createdAt,
        updatedAt: statusData.updatedAt
      })
    );
  });
}

// packages/cli/src/commands/list.ts
init_storage();
import { Command as Command4 } from "commander";
import chalk3 from "chalk";
function createListCommand() {
  return new Command4("list").description("\u5217\u51FA\u6240\u6709\u4EFB\u52A1").action(() => {
    const tasks = listTasks();
    if (tasks.length === 0) {
      console.log(chalk3.gray("\u{1F4CB} \u6682\u65E0\u4EFB\u52A1"));
      return;
    }
    console.log(chalk3.blue(`
\u{1F4CB} \u4EFB\u52A1\u5217\u8868 (${tasks.length})`));
    console.log(chalk3.gray("\u2500".repeat(60)));
    for (const task of tasks) {
      const statusIcon = task.status === "confirmed" ? "\u2705" : task.status === "completed" ? "\u{1F3C1}" : task.status === "cancelled" ? "\u274C" : "\u23F3";
      console.log(
        `  ${statusIcon} ${chalk3.cyan(task.id.padEnd(24))} ${chalk3.gray(task.status.padEnd(12))} ${task.createdAt ? formatTime(task.createdAt) : ""}`
      );
    }
    console.log(chalk3.gray("\u2500".repeat(60)));
  });
}
function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN");
  } catch {
    return iso;
  }
}

// packages/cli/src/commands/complete.ts
init_storage();
import { Command as Command5 } from "commander";
import chalk4 from "chalk";
function createCompleteCommand() {
  return new Command5("complete").description("\u6807\u8BB0\u4EFB\u52A1\u5B8C\u6210").requiredOption("--id <id>", "\u4EFB\u52A1 ID").requiredOption("--summary <text>", "\u65BD\u5DE5\u6458\u8981").action(async (options) => {
    const { id: taskId, summary } = options;
    const basePath = getStorageBasePath();
    if (!taskExists(taskId, basePath)) {
      console.error(chalk4.red(`\u274C \u4EFB\u52A1\u4E0D\u5B58\u5728: ${taskId}`));
      process.exit(3);
    }
    writeStatus(taskId, "completed", basePath);
    try {
      const { readSpec: readSpec2, writeSpec: writeSpec2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const spec = readSpec2(taskId, basePath);
      spec.meta.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      spec.userAdditions.notes = spec.userAdditions.notes ? `${spec.userAdditions.notes}

\u65BD\u5DE5\u6458\u8981: ${summary}` : `\u65BD\u5DE5\u6458\u8981: ${summary}`;
      writeSpec2(taskId, spec, basePath);
    } catch {
    }
    console.log(chalk4.green(`\u2705 \u4EFB\u52A1\u5DF2\u5B8C\u6210: ${taskId}`));
    console.log(chalk4.gray(`  \u6458\u8981: ${summary}`));
  });
}

// packages/cli/src/commands/config.ts
init_src();
import { Command as Command6 } from "commander";
import chalk5 from "chalk";
import fs3 from "node:fs";
import path3 from "node:path";
import os from "node:os";
var CONFIG_DIR = path3.join(os.homedir(), ".spec-thought-align");
var CONFIG_FILE = path3.join(CONFIG_DIR, "config.json");
function readConfig() {
  try {
    const raw = fs3.readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
function writeConfig(cfg) {
  fs3.mkdirSync(CONFIG_DIR, { recursive: true });
  fs3.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}
function setNested(obj, keyPath, value) {
  const keys = keyPath.split(".");
  const last = keys.pop();
  let current = obj;
  for (const k of keys) {
    if (!current[k] || typeof current[k] !== "object") {
      current[k] = {};
    }
    current = current[k];
  }
  const old = current[last];
  if (typeof old === "number") {
    current[last] = Number(value);
  } else if (typeof old === "boolean") {
    current[last] = value === "true";
  } else {
    current[last] = value;
  }
}
function formatValue(v) {
  if (v === void 0 || v === null) return chalk5.gray("(not set)");
  if (typeof v === "boolean") return v ? chalk5.green("true") : chalk5.red("false");
  if (typeof v === "number") return chalk5.yellow(String(v));
  if (typeof v === "string") return chalk5.cyan(v);
  return String(v);
}
function printConfig(cfg) {
  const keys = [
    { key: "server.port", value: cfg.server.port },
    { key: "server.host", value: cfg.server.host },
    { key: "storage.path", value: cfg.storage.path },
    { key: "llm.enabled", value: cfg.llm.enabled },
    { key: "llm.provider", value: cfg.llm.provider },
    { key: "llm.model", value: cfg.llm.model },
    { key: "llm.baseUrl", value: cfg.llm.baseUrl },
    { key: "llm.apiKey", value: cfg.llm.apiKey ? "***" : null },
    { key: "ui.autoOpen", value: cfg.ui.autoOpen }
  ];
  for (const { key, value } of keys) {
    const padded = key.padEnd(20);
    console.log(`  ${chalk5.gray(padded)} ${formatValue(value)}`);
  }
  console.log();
  console.log(chalk5.dim(`  \u914D\u7F6E\u6587\u4EF6: ${CONFIG_FILE}`));
}
function createConfigCommand() {
  const cmd = new Command6("config").description("\u67E5\u770B\u6216\u4FEE\u6539\u5168\u5C40\u914D\u7F6E");
  cmd.command("show").description("\u67E5\u770B\u5F53\u524D\u914D\u7F6E").action(() => {
    const cfg = readConfig();
    console.log(chalk5.blue("\u2699\uFE0F  Spec-Align \u5168\u5C40\u914D\u7F6E\n"));
    printConfig(cfg);
  });
  cmd.command("set <key> <value>").description("\u8BBE\u7F6E\u914D\u7F6E\u9879\uFF08\u5982 server.port=3000\uFF09").action((key, value) => {
    const cfg = readConfig();
    setNested(cfg, key, value);
    writeConfig(cfg);
    console.log(chalk5.green(`\u2705 \u5DF2\u8BBE\u7F6E ${chalk5.cyan(key)} = ${chalk5.yellow(value)}`));
  });
  cmd.command("reset").description("\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u914D\u7F6E").action(() => {
    writeConfig({ ...DEFAULT_CONFIG });
    console.log(chalk5.green("\u2705 \u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u914D\u7F6E"));
    printConfig(DEFAULT_CONFIG);
  });
  return cmd;
}

// packages/cli/src/commands/split.ts
init_storage();
import { Command as Command7 } from "commander";

// packages/cli/src/engine/splitter.ts
init_src();
var SMALL_TASK_THRESHOLD = 3;
var LARGE_SCOPE_SPLIT_THRESHOLD = 2;
function splitSpecToSubTasks(spec) {
  const subtasks = [];
  const { scope, plan, io } = spec;
  const allScope = [...scope.inScope];
  const allComponents = plan.components.map((c) => c.name);
  for (const item of allScope) {
    const criteria = io.acceptanceCriteria.filter(
      (ac) => ac.toLowerCase().includes(item.slice(0, 4).toLowerCase()) || item.toLowerCase().includes(ac.slice(0, 4).toLowerCase())
    );
    subtasks.push({
      id: generateId("sub"),
      description: item,
      relatedScope: [item],
      acceptanceCriteria: criteria.length > 0 ? criteria : io.acceptanceCriteria.slice(0, 2),
      status: "pending",
      agentNote: "",
      dependencies: [],
      context: buildSubTaskContext(spec, item)
    });
  }
  for (const comp of allComponents) {
    const alreadyCovered = subtasks.some(
      (s) => s.description.includes(comp) || s.relatedScope.some((rs) => rs.includes(comp))
    );
    if (!alreadyCovered) {
      subtasks.push({
        id: generateId("sub"),
        description: `\u5B9E\u73B0\u7EC4\u4EF6: ${comp}`,
        relatedScope: [comp],
        acceptanceCriteria: io.acceptanceCriteria.slice(0, 2),
        status: "pending",
        agentNote: "",
        dependencies: [],
        context: buildSubTaskContext(spec, comp)
      });
    }
  }
  const merged = mergeSmallTasks(subtasks, allScope);
  const split = splitLargeTasks(merged);
  return inferDependencies({
    taskId: spec.meta.id,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    subtasks: split
  });
}
function buildSubTaskContext(spec, _relatedItem) {
  return {
    goal: spec.understanding.goal || void 0,
    techStack: spec.plan.techStack.length > 0 ? spec.plan.techStack : void 0,
    architecture: spec.plan.architecture || void 0,
    constraints: spec.scope.constraints.length > 0 ? spec.scope.constraints : void 0,
    outOfScope: spec.scope.outOfScope.length > 0 ? spec.scope.outOfScope : void 0
  };
}
function mergeSmallTasks(subtasks, allScope) {
  if (subtasks.length <= SMALL_TASK_THRESHOLD) return subtasks;
  const result = [];
  let pending = [];
  for (const st of subtasks) {
    const isSmall = st.description.length < 10 && st.relatedScope.length <= 1;
    if (isSmall && allScope.join(" ").includes(st.description)) {
      pending.push(st);
    } else {
      if (pending.length > 0) {
        result.push(mergeGroup(pending));
        pending = [];
      }
      result.push(st);
    }
  }
  if (pending.length > 0) {
    result.push(mergeGroup(pending));
  }
  return result;
}
function mergeGroup(group) {
  return {
    id: generateId("sub"),
    description: group.map((g) => g.description).join(" + "),
    relatedScope: group.flatMap((g) => g.relatedScope),
    acceptanceCriteria: [...new Set(group.flatMap((g) => g.acceptanceCriteria))],
    status: "pending",
    agentNote: "",
    dependencies: [],
    context: group[0].context
  };
}
function splitLargeTasks(subtasks) {
  const result = [];
  for (const st of subtasks) {
    if (st.relatedScope.length > LARGE_SCOPE_SPLIT_THRESHOLD) {
      for (const scope of st.relatedScope) {
        result.push({
          ...st,
          id: generateId("sub"),
          description: scope,
          relatedScope: [scope]
        });
      }
    } else {
      result.push(st);
    }
  }
  return result;
}
function inferDependencies(manifest) {
  const apiKeywords = ["API", "\u63A5\u53E3", "\u8DEF\u7531", "Router", "Controller", "\u670D\u52A1", "Service"];
  const uiKeywords = ["\u9875\u9762", "\u7EC4\u4EF6", "\u524D\u7AEF", "UI", "\u754C\u9762", "\u6837\u5F0F"];
  for (const st of manifest.subtasks) {
    const lower = st.description.toLowerCase();
    const hasAPI = apiKeywords.some((k) => lower.includes(k.toLowerCase()));
    const hasUI = uiKeywords.some((k) => lower.includes(k.toLowerCase()));
    if (hasAPI) {
      st.dependencies = manifest.subtasks.filter(
        (s) => dbsKeywords.some((k) => s.description.toLowerCase().includes(k.toLowerCase()))
      ).map((s) => s.id);
    }
    if (hasUI) {
      st.dependencies = manifest.subtasks.filter(
        (s) => apiKeywords.some((k) => s.description.toLowerCase().includes(k.toLowerCase()))
      ).map((s) => s.id);
    }
  }
  return manifest;
}
var dbsKeywords = ["\u6570\u636E\u5E93", "\u6A21\u578B", "Model", "Schema", "\u6570\u636E", "\u5B58\u50A8", "DB"];

// packages/cli/src/commands/split.ts
import chalk6 from "chalk";
function createSplitCommand() {
  return new Command7("split").description("\u5C06\u5DF2\u786E\u8BA4\u7684\u89C4\u7EA6\u62C6\u5206\u4E3A\u5B50\u4EFB\u52A1\u6E05\u5355").requiredOption("--id <id>", "\u4EFB\u52A1 ID").action(async (options) => {
    const { id } = options;
    try {
      const spec = readSpec(id);
      if (spec.meta.status !== "confirmed") {
        console.error(chalk6.red(`\u4EFB\u52A1 ${id} \u5C1A\u672A\u786E\u8BA4\uFF0C\u72B6\u6001: ${spec.meta.status}`));
        process.exit(1);
      }
      const manifest = splitSpecToSubTasks(spec);
      writeTaskManifest(id, manifest);
      console.log(chalk6.green(`
\u2705 \u5DF2\u62C6\u5206 ${manifest.subtasks.length} \u4E2A\u5B50\u4EFB\u52A1:
`));
      for (const st of manifest.subtasks) {
        const depStr = st.dependencies.length > 0 ? chalk6.gray(` \u2190 \u4F9D\u8D56: ${st.dependencies.join(", ")}`) : "";
        console.log(
          `  ${chalk6.cyan(st.id)}  ${st.description}  [${st.acceptanceCriteria.length} \u9A8C\u6536]${depStr}`
        );
      }
      console.log(chalk6.gray(`
\u6E05\u5355\u5DF2\u4FDD\u5B58: .spec-thought-align/${id}/tasks.json`));
      console.log(
        chalk6.gray(`\u5B50\u4EFB\u52A1\u4E0A\u4E0B\u6587\u63D0\u53D6: npx spec-thought-align start --id ${id} --sub <subId>`)
      );
    } catch (e) {
      console.error(chalk6.red(e.message));
      process.exit(1);
    }
  });
}

// packages/cli/src/commands/start.ts
init_storage();
import { Command as Command8 } from "commander";
import chalk7 from "chalk";
function createStartCommand() {
  return new Command8("start").description("\u63D0\u53D6\u5B50\u4EFB\u52A1\u6240\u9700\u7684\u6700\u5C0F\u4E0A\u4E0B\u6587\uFF0C\u4F9B\u5B50 Agent \u4F7F\u7528").requiredOption("--id <id>", "\u4EFB\u52A1 ID").requiredOption("--sub <subId>", "\u5B50\u4EFB\u52A1 ID").action(async (options) => {
    const { id, sub } = options;
    try {
      const manifest = readTaskManifest(id);
      if (!manifest) {
        console.error(chalk7.red(`\u4EFB\u52A1 ${id} \u4E0D\u5B58\u5728\u5B50\u4EFB\u52A1\u6E05\u5355\uFF0C\u8BF7\u5148\u6267\u884C split`));
        process.exit(1);
      }
      const subtask = manifest.subtasks.find((s) => s.id === sub);
      if (!subtask) {
        console.error(chalk7.red(`\u5B50\u4EFB\u52A1 ${sub} \u4E0D\u5B58\u5728`));
        process.exit(1);
      }
      const context = {
        parentTask: id,
        subTask: {
          id: subtask.id,
          description: subtask.description,
          relatedScope: subtask.relatedScope,
          acceptanceCriteria: subtask.acceptanceCriteria,
          dependencies: subtask.dependencies
        },
        context: subtask.context || {}
      };
      console.log(JSON.stringify(context, null, 2));
    } catch (e) {
      console.error(chalk7.red(e.message));
      process.exit(1);
    }
  });
}

// packages/cli/src/commands/verify.ts
init_storage();
import { Command as Command9 } from "commander";
import chalk8 from "chalk";
function createVerifyCommand() {
  return new Command9("verify").description("\u68C0\u67E5\u5B50\u4EFB\u52A1\u5B8C\u6210\u72B6\u6001\uFF0C\u8F93\u51FA\u9A8C\u6536\u62A5\u544A").requiredOption("--id <id>", "\u4EFB\u52A1 ID").option("--sub <subId>", "\u4EC5\u68C0\u67E5\u6307\u5B9A\u5B50\u4EFB\u52A1").option("--mark-done", "\u81EA\u52A8\u5C06 done \u5B50\u4EFB\u52A1\u6807\u8BB0\u4E3A\u5B8C\u6210(\u7531\u4E3B Agent \u8C03\u7528)").action(async (options) => {
    const { id, sub, markDone } = options;
    try {
      const spec = readSpec(id);
      const statuses = getSubTaskStatus(id);
      if (statuses.length === 0) {
        console.error(chalk8.red(`\u4EFB\u52A1 ${id} \u4E0D\u5B58\u5728\u5B50\u4EFB\u52A1\u6E05\u5355`));
        process.exit(1);
      }
      const toCheck = sub ? statuses.filter((s) => s.id === sub) : statuses;
      if (sub && toCheck.length === 0) {
        console.error(chalk8.red(`\u5B50\u4EFB\u52A1 ${sub} \u4E0D\u5B58\u5728`));
        process.exit(1);
      }
      console.log(chalk8.bold(`
\u{1F4CB} \u9A8C\u6536\u62A5\u544A: ${id}
`));
      const done = toCheck.filter((s) => s.status === "done");
      const pending = toCheck.filter((s) => s.status === "pending" || s.status === "in-progress");
      const failed = toCheck.filter((s) => s.status === "failed");
      const passed = [];
      const unchecked = [];
      for (const st of done) {
        for (const ac of st.acceptanceCriteria) {
          if (st.agentNote) {
            passed.push(`${st.id}: ${ac} \u2192 ${st.agentNote}`);
          } else {
            unchecked.push(`${st.id}: ${ac}`);
          }
        }
      }
      const totalCriteria = spec.io.acceptanceCriteria.length;
      console.log(chalk8.gray(`\u603B\u9A8C\u6536\u6807\u51C6: ${totalCriteria} \u6761`));
      console.log(chalk8.green(`\u5DF2\u901A\u8FC7: ${passed.length} \u6761`));
      console.log(
        chalk8.yellow(
          `\u5F85\u68C0\u67E5: ${unchecked.length + (pending.length > 0 ? pending.length : 0) * 2} \u6761`
        )
      );
      if (failed.length > 0) console.log(chalk8.red(`\u5931\u8D25: ${failed.length} \u9879`));
      console.log(`
${chalk8.bold("\u5B50\u4EFB\u52A1\u72B6\u6001:")}`);
      for (const st of toCheck) {
        const icon = st.status === "done" ? "\u2705" : st.status === "failed" ? "\u274C" : st.status === "in-progress" ? "\u{1F504}" : "\u23F3";
        const depStr = st.dependencies.length > 0 ? chalk8.gray(` (\u4F9D\u8D56: ${st.dependencies.join(", ")})`) : "";
        console.log(
          `  ${icon} ${chalk8.cyan(st.id)} ${st.status.padEnd(12)} ${st.description}${depStr}`
        );
      }
      for (const st of done) {
        if (passed.length > 0) {
          console.log(chalk8.green(`
  \u2705 ${st.id}: ${st.description}`));
          for (const ac of st.acceptanceCriteria) {
            console.log(chalk8.gray(`     \u2514 ${ac}`));
          }
        }
      }
      const needsReview = [...pending, ...failed];
      if (needsReview.length > 0) {
        console.log(chalk8.yellow(`
\u26A0\uFE0F  \u4E3B Agent \u9700\u9A8C\u6536: ${needsReview.length} \u9879`));
        for (const st of needsReview) {
          console.log(chalk8.yellow(`  ${st.id}: ${st.description}`));
          for (const ac of st.acceptanceCriteria) {
            console.log(chalk8.gray(`     \u2514 ${ac}`));
          }
        }
      }
      if (markDone && pending.length === 0 && failed.length === 0) {
        const manifest = readTaskManifest(id);
        if (manifest) {
          const allDone = manifest.subtasks.every((s) => s.status === "done");
          if (allDone) {
            console.log(chalk8.green("\n\u{1F389} \u6240\u6709\u5B50\u4EFB\u52A1\u5DF2\u5B8C\u6210\uFF01"));
          }
        }
      }
      const allDoneCount = toCheck.filter((s) => s.status === "done").length;
      if (allDoneCount === toCheck.length) {
        console.log(chalk8.green("\n\u2705 \u5168\u90E8\u5B50\u4EFB\u52A1\u5DF2\u9A8C\u6536\u901A\u8FC7"));
      }
    } catch (e) {
      console.error(chalk8.red(e.message));
      process.exit(1);
    }
  });
}

// packages/cli/src/commands/await-confirm.ts
init_src();
init_storage();
import { Command as Command10 } from "commander";
import chalk9 from "chalk";
import http2 from "node:http";
var DEFAULT_PORT = 5678;
function httpGet(url, timeoutMs = 2e3) {
  return new Promise((resolve, reject) => {
    const req = http2.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}
async function pollHttpApi(taskId, port, timeoutSeconds) {
  const startTime = Date.now();
  const url = `http://localhost:${port}/api/task/${taskId}`;
  while (true) {
    const elapsed = (Date.now() - startTime) / 1e3;
    if (elapsed > timeoutSeconds) {
      return { success: false, exitCode: EXIT_CODES.TIMEOUT };
    }
    try {
      const resp = await httpGet(url);
      if (resp.success && resp.data?.meta?.status === "confirmed") {
        return { success: true, exitCode: EXIT_CODES.CONFIRMED, data: resp.data };
      }
      if (resp.success && resp.data?.meta?.status === "cancelled") {
        return { success: false, exitCode: EXIT_CODES.CANCELLED };
      }
    } catch {
      return { success: false, exitCode: EXIT_CODES.ERROR };
    }
    await sleep2(POLL_INTERVAL_MS);
  }
}
async function pollFilesystem(taskId, timeoutSeconds, basePath) {
  const startTime = Date.now();
  while (true) {
    const elapsed = (Date.now() - startTime) / 1e3;
    if (elapsed > timeoutSeconds) {
      return { success: false, exitCode: EXIT_CODES.TIMEOUT };
    }
    try {
      const statusData = readStatus(taskId, basePath);
      if (statusData.status === "confirmed") {
        const result = readResult(taskId, basePath) || readSpec(taskId, basePath);
        return { success: true, exitCode: EXIT_CODES.CONFIRMED, data: result };
      }
      if (statusData.status === "cancelled") {
        return { success: false, exitCode: EXIT_CODES.CANCELLED };
      }
    } catch {
    }
    await sleep2(POLL_INTERVAL_MS);
  }
}
async function checkOnce(taskId, port, basePath) {
  try {
    const resp = await httpGetTimedOut(`http://localhost:${port}/api/task/${taskId}`, 2e3);
    if (resp && resp.success && resp.data?.meta?.status === "confirmed") {
      return { success: true, data: resp.data };
    }
    if (resp && resp.success && resp.data?.meta?.status === "cancelled") {
      return { success: false };
    }
  } catch {
  }
  try {
    const statusData = readStatus(taskId, basePath);
    if (statusData.status === "confirmed") {
      const result = readResult(taskId, basePath) || readSpec(taskId, basePath);
      return { success: true, data: result };
    }
    if (statusData.status === "cancelled") {
      return { success: false };
    }
  } catch {
  }
  return { success: false };
}
async function httpGetTimedOut(url, timeoutMs) {
  try {
    return await httpGet(url, timeoutMs);
  } catch {
    return null;
  }
}
function createAwaitConfirmCommand() {
  return new Command10("await-confirm").description("\u7B49\u5F85\u7528\u6237\u786E\u8BA4\u5E76\u8FD4\u56DE\u6700\u7EC8\u89C4\u7EA6 JSON\uFF08\u53EF\u5728\u8FDB\u7A0B\u88AB\u7EC8\u6B62\u540E\u91CD\u65B0\u8FDE\u63A5\uFF09").requiredOption("--id <id>", "\u4EFB\u52A1 ID").option("--timeout <seconds>", "\u8D85\u65F6\u79D2\u6570", String(DEFAULT_TIMEOUT_SECONDS)).option("--port <port>", "HTTP Server \u7AEF\u53E3", String(DEFAULT_PORT)).option("--check", "\u5FEB\u901F\u68C0\u67E5\u6A21\u5F0F\uFF1A\u4EC5\u68C0\u67E5\u4E00\u6B21\uFF0C\u4E0D\u8F6E\u8BE2\uFF08\u9002\u7528\u4E8E\u6709 exec \u8D85\u65F6\u7684 Agent\uFF09").action(async (options) => {
    const { id: taskId, timeout: timeoutStr, port: portStr, check } = options;
    const timeout = parseInt(timeoutStr, 10);
    const port = parseInt(portStr, 10);
    const basePath = getStorageBasePath();
    if (check) {
      const result2 = await checkOnce(taskId, port, basePath);
      if (result2.success) {
        printResult(result2.data);
        return;
      }
      console.log(chalk9.yellow(`
\u23F3 \u5F85\u786E\u8BA4: ${taskId}`));
      console.log(chalk9.gray(`   \u9762\u677F: http://localhost:${port}/task/${taskId}`));
      process.exit(EXIT_CODES.TIMEOUT);
      return;
    }
    const startedAt = Date.now();
    console.log(chalk9.blue(`
\u23F3 \u7B49\u5F85\u786E\u8BA4: ${taskId}`));
    console.log(chalk9.gray(`   \u8D85\u65F6: ${timeout}s | Server \u7AEF\u53E3: ${port}`));
    console.log(chalk9.gray(`   \u8FDE\u63A5 Server...`));
    const httpBudget = Math.min(timeout, 10);
    let result = await pollHttpApi(taskId, port, httpBudget);
    if (result.success) {
      printResult(result.data);
      return;
    }
    if (result.exitCode === EXIT_CODES.CANCELLED) {
      console.log(chalk9.red(`
\u274C \u7528\u6237\u5DF2\u53D6\u6D88`));
      process.exit(EXIT_CODES.CANCELLED);
    }
    const elapsed = (Date.now() - startedAt) / 1e3;
    const remainingTimeout = Math.max(0, timeout - elapsed);
    console.log(
      chalk9.yellow(
        `   HTTP \u8F6E\u8BE2\u672A\u786E\u8BA4\uFF0C\u5207\u6362\u5230\u6587\u4EF6\u7CFB\u7EDF\u8F6E\u8BE2 (\u5269\u4F59 ${Math.ceil(remainingTimeout)}s)...`
      )
    );
    result = await pollFilesystem(taskId, remainingTimeout, basePath);
    if (result.success) {
      printResult(result.data);
      return;
    }
    if (result.exitCode === EXIT_CODES.CANCELLED) {
      console.log(chalk9.red(`
\u274C \u7528\u6237\u5DF2\u53D6\u6D88`));
      process.exit(EXIT_CODES.CANCELLED);
    }
    console.log(chalk9.red(`
\u23F1\uFE0F  \u7B49\u5F85\u8D85\u65F6 (${timeout}s)`));
    console.log(chalk9.gray(`   \u8BF7\u786E\u8BA4\u9762\u677F\u662F\u5426\u4ECD\u5728\u8FD0\u884C: http://localhost:${port}/task/${taskId}`));
    process.exit(EXIT_CODES.TIMEOUT);
  });
}
function printResult(data) {
  console.log(chalk9.green(`
\u2705 \u7528\u6237\u5DF2\u786E\u8BA4\u89C4\u7EA6\uFF01`));
  console.log(JSON.stringify(data, null, 2));
  process.exit(EXIT_CODES.CONFIRMED);
}
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// packages/cli/src/commands/__serve.ts
import { Command as Command11 } from "commander";
function createServeCommand() {
  return new Command11("__serve").description("(\u5185\u90E8) \u540E\u53F0\u542F\u52A8 HTTP Server").requiredOption("--port <port>", "\u7AEF\u53E3\u53F7").action(async (options) => {
    const port = parseInt(options.port, 10);
    await ensureServer(port);
    setInterval(() => {
    }, 6e4);
  });
}

// packages/cli/src/commands/detect.ts
import { Command as Command12 } from "commander";

// packages/cli/src/adapters/base.ts
var DEFAULT_TRIGGER_RULES = [
  {
    name: "single-file-trivial",
    description: "\u5355\u6587\u4EF6\u5C0F\u6539\u52A8\uFF08\u4FEE bug\u3001\u6539\u914D\u7F6E\u3001\u52A0\u6CE8\u91CA\u3001\u683C\u5F0F\u5316\u3001\u91CD\u547D\u540D\uFF09",
    evaluate: (ctx) => (ctx.fileCount ?? 0) <= 1 && ctx.complexity !== "high" && !ctx.isNewFeature && !ctx.isBugFix && !ctx.hasArchitectureChange,
    action: "skip",
    priority: 100,
    reason: "\u5355\u6587\u4EF6\u5C0F\u6539\u52A8\uFF0C\u65E0\u67B6\u6784\u5F71\u54CD"
  },
  {
    name: "new-feature",
    description: "\u65B0\u529F\u80FD\u5F00\u53D1",
    evaluate: (ctx) => ctx.isNewFeature === true,
    action: "require",
    priority: 10,
    reason: "\u65B0\u529F\u80FD\u5F00\u53D1\uFF0C\u5EFA\u8BAE\u8D70\u9700\u6C42\u786E\u8BA4\u6D41\u7A0B"
  },
  {
    name: "architecture-change",
    description: "\u6D89\u53CA\u67B6\u6784\u53D8\u66F4\u3001\u6280\u672F\u9009\u578B",
    evaluate: (ctx) => ctx.hasArchitectureChange === true,
    action: "require",
    priority: 10,
    reason: "\u6D89\u53CA\u67B6\u6784\u53D8\u66F4\uFF0C\u5FC5\u987B\u786E\u8BA4\u9700\u6C42"
  },
  {
    name: "bug-fix-ambiguous",
    description: "Bug \u4FEE\u590D\u4F46\u7F3A\u5C11\u95EE\u9898\u63CF\u8FF0\u548C\u5B9A\u4F4D\u4FE1\u606F",
    evaluate: (ctx) => ctx.isBugFix === true && (!ctx.hasDetailedContext || ctx.hasAmbiguity === true),
    action: "require",
    priority: 15,
    reason: "Bug \u4FEE\u590D\u9700\u786E\u8BA4\u95EE\u9898\u63CF\u8FF0\u548C\u5B9A\u4F4D\u4FE1\u606F"
  },
  {
    name: "bug-fix-well-described",
    description: "Bug \u4FEE\u590D\u4E14\u95EE\u9898\u63CF\u8FF0\u6E05\u6670\u3001\u5B9A\u4F4D\u4FE1\u606F\u5145\u5206",
    evaluate: (ctx) => ctx.isBugFix === true && ctx.hasDetailedContext === true,
    action: "suggest",
    priority: 25,
    reason: "Bug \u63CF\u8FF0\u6E05\u6670\uFF0C\u5EFA\u8BAE\u5FEB\u901F\u786E\u8BA4\u540E\u4FEE\u590D"
  },
  {
    name: "multi-file-refactor",
    description: "\u591A\u6587\u4EF6\u91CD\u6784\uFF08>2 \u4E2A\u6587\u4EF6\uFF09",
    evaluate: (ctx) => (ctx.fileCount ?? 0) > 2 && !ctx.isBugFix,
    action: "require",
    priority: 20,
    reason: "\u591A\u6587\u4EF6\u6539\u52A8\uFF0C\u5EFA\u8BAE\u786E\u8BA4\u5F71\u54CD\u8303\u56F4"
  },
  {
    name: "ambiguous-requirement",
    description: "\u9700\u6C42\u5B58\u5728\u6A21\u7CCA\u4E4B\u5904",
    evaluate: (ctx) => ctx.hasAmbiguity === true,
    action: "suggest",
    priority: 30,
    reason: "\u9700\u6C42\u5B58\u5728\u6A21\u7CCA\u4E4B\u5904\uFF0C\u5EFA\u8BAE\u6F84\u6E05"
  },
  {
    name: "high-complexity",
    description: "\u5F71\u54CD\u8303\u56F4\u4E0D\u6E05\u6670\u6216\u590D\u6742\u5EA6\u9AD8",
    evaluate: (ctx) => ctx.complexity === "high",
    action: "suggest",
    priority: 40,
    reason: "\u590D\u6742\u5EA6\u9AD8\uFF0C\u5F71\u54CD\u8303\u56F4\u4E0D\u591F\u6E05\u6670"
  },
  {
    name: "medium-complexity",
    description: "\u4E2D\u7B49\u590D\u6742\u5EA6\u9ED8\u8BA4\u5EFA\u8BAE",
    evaluate: (ctx) => ctx.complexity === "medium",
    action: "suggest",
    priority: 50,
    reason: "\u4E2D\u7B49\u590D\u6742\u5EA6\uFF0C\u5EFA\u8BAE\u786E\u8BA4\u9700\u6C42"
  },
  {
    name: "default-skip",
    description: "\u9ED8\u8BA4\u8DF3\u8FC7\uFF08\u4F4E\u590D\u6742\u5EA6\u4E14\u65E0\u89E6\u53D1\u6761\u4EF6\uFF09",
    evaluate: () => true,
    action: "skip",
    priority: 999,
    reason: "\u65E0\u89E6\u53D1\u6761\u4EF6\uFF0C\u53EF\u8DF3\u8FC7"
  }
];
function evaluateRules(rules, context) {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  const matchedRules = sorted.map((rule) => ({
    name: rule.name,
    matched: rule.evaluate(context),
    action: rule.action,
    reason: rule.reason
  }));
  const matching = matchedRules.filter((r) => r.matched);
  if (matching.length === 0) {
    return {
      shouldTrigger: true,
      mode: "suggest",
      reason: "\u65E0\u6CD5\u786E\u5B9A\uFF0C\u9ED8\u8BA4\u5EFA\u8BAE\u786E\u8BA4",
      matchedRules
    };
  }
  const first = matching[0];
  const mode = first.action;
  const shouldTrigger = mode !== "skip";
  return {
    shouldTrigger,
    mode,
    reason: first.reason,
    matchedRules
  };
}
var BaseAdapter = class {
  get triggerRules() {
    return DEFAULT_TRIGGER_RULES;
  }
  shouldTrigger(context) {
    return evaluateRules(this.triggerRules, context);
  }
};

// packages/cli/src/adapters/opencode.ts
var opencodeAdapter = new class extends BaseAdapter {
  id = "opencode";
  name = "opencode";
  displayName = "opencode";
  integration = {
    configFilePath: "~/.config/opencode/AGENTS.md",
    configTemplate: `## Spec-Align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B\uFF08\u534A\u786C\u7EA6\u675F\uFF09

\u5728\u7F16\u5199\u4EE3\u7801\u524D\uFF0C\u5FC5\u987B\u6309\u4EE5\u4E0B\u6B65\u9AA4\u6267\u884C\uFF1A

### \u6B65\u9AA4 0\uFF1A\u7A0B\u5E8F\u5316\u89E6\u53D1\u68C0\u6D4B\uFF08\u534A\u786C\u7EA6\u675F \u2014 \u5FC5\u987B\u8C03\u7528\uFF09

\u5728\u5206\u6790\u7528\u6237\u9700\u6C42\u540E\uFF0C**\u5FC5\u987B\u5148\u8C03\u7528 detect \u547D\u4EE4**\u4EE5\u7A0B\u5E8F\u5316\u5224\u65AD\u662F\u5426\u9700\u8981\u8D70 spec-align \u6D41\u7A0B\uFF1A

\`\`\`
spec-thought-align detect --platform opencode --files <\u9884\u4F30\u4FEE\u6539\u6587\u4EF6\u6570> --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`

detect \u8FD4\u56DE JSON\uFF0C\u6839\u636E mode \u51B3\u5B9A\uFF1A
- mode: "require" \u2014 **\u5FC5\u987B**\u8D70 spec-align \u6D41\u7A0B\uFF0C\u76F4\u63A5\u8FDB\u5165\u6B65\u9AA4 1
- mode: "suggest" \u2014 **\u5E94\u8BE5**\u8BE2\u95EE\u7528\u6237\u662F\u5426\u4F7F\u7528 spec-align\uFF08\u8C03\u7528 question \u5DE5\u5177\uFF09
- mode: "skip" \u2014 **\u53EF\u4EE5**\u8DF3\u8FC7\uFF0C\u76F4\u63A5\u65BD\u5DE5

### \u6B65\u9AA4 1\uFF1A\u7528\u6237\u81EA\u4E3B\u89E6\u53D1\uFF08\u5FEB\u6377\u8BED\u6CD5\uFF09

\u7528\u6237\u53EF\u4EE5\u901A\u8FC7\u4EE5\u4E0B\u65B9\u5F0F\u76F4\u63A5\u89E6\u53D1\u9700\u6C42\u786E\u8BA4\uFF08\u65E0\u9700 Agent \u5224\u65AD\uFF09\uFF1A
- \u660E\u786E\u8BF4"\u7528 spec-align"
- \u4F7F\u7528\u5FEB\u6377\u8BED\u6CD5\uFF1A\u5728\u5BF9\u8BDD\u4E2D\u8F93\u5165 spec-thought-align "\u7528\u6237\u9700\u6C42"

### \u6B65\u9AA4 2\uFF1AAgent \u5206\u6790\u548C\u89C4\u7EA6\u63D0\u4EA4

1. \u7528\u81EA\u7136\u8BED\u8A00\u8F93\u51FA\u4F60\u5BF9\u9700\u6C42\u7684\u7406\u89E3\u548C\u5206\u6790\uFF0C\u5FC5\u987B\u9010\u6761\u56DE\u7B54\u4EE5\u4E0B\u4E24\u4E2A\u95EE\u9898\uFF1A
   - **\u4E0D\u786E\u5B9A\u68C0\u67E5**\uFF1A\u6211\u662F\u4E0D\u662F\u6709\u4E0D\u786E\u5B9A\u7684\u5730\u65B9\uFF0C\u5728\u731C\u6D4B\u7528\u6237\u7684\u610F\u601D\uFF1F\u5982\u679C\u6709\uFF0C\u660E\u786E\u6807\u51FA\u5E76\u4EE5"\u4E0D\u786E\u5B9A\uFF1A"\u5F00\u5934
   - **\u5F71\u54CD\u8303\u56F4\u8BC4\u4F30**\uFF1A\u4F1A\u4E0D\u4F1A\u4EA7\u751F\u7ED3\u6784\u6027\u53D8\u5316\uFF0C\u5F71\u54CD\u7684\u8303\u56F4\u6709\u54EA\u4E9B\uFF1F\u660E\u786E\u5217\u51FA\u53D7\u5F71\u54CD\u7684\u6587\u4EF6/\u6A21\u5757

2. \u63D0\u4EA4\u89C4\u7EA6\uFF08\u4F7F\u7528 --no-wait \u907F\u514D bash \u5DE5\u5177\u8D85\u65F6\uFF09\uFF1A
   \`\`\`
   spec-thought-align submit --id "<\u4EFB\u52A1\u540D>" --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" --analysis "<\u4F60\u7684\u5B8C\u6574\u5206\u6790>" --no-wait
   \`\`\`

3. \u7ACB\u5373\u7B49\u5F85\u7528\u6237\u786E\u8BA4\uFF08HTTP API \u8F6E\u8BE2\uFF0C\u6BCF 1s \u68C0\u6D4B\u4E00\u6B21\uFF0C\u786E\u8BA4\u540E\u81EA\u52A8\u8FD4\u56DE\uFF09\uFF1A
   \`\`\`
   spec-thought-align await-confirm --id "<\u4EFB\u52A1\u540D>" --timeout 600
   \`\`\`

4. \u547D\u4EE4\u8FD4\u56DE JSON \u662F\u6700\u7EC8\u89C4\u7EA6\uFF0C\u4E25\u683C\u6309\u5B83\u65BD\u5DE5
   - \u9762\u677F\u4E2D\u7684 questions \u5728\u7528\u6237\u786E\u8BA4\u65F6\u53EF\u80FD\u83B7\u5F97\u9010\u6761\u6F84\u6E05\uFF0C\u6F84\u6E05\u5185\u5BB9\u4F53\u73B0\u5728\u6700\u7EC8\u89C4\u7EA6\u7684 userAdditions \u6216\u5BF9\u5E94\u7684\u5B57\u6BB5\u4FEE\u6539\u4E2D
   - \u65BD\u5DE5\u65F6\u4EE5\u7528\u6237\u786E\u8BA4\u540E\u7684\u6700\u7EC8\u89C4\u7EA6\u4E3A\u51C6\uFF0C\u4E0D\u53EF\u5BF9\u7528\u6237\u5DF2\u56DE\u7B54\u7684\u95EE\u9898\u81EA\u884C\u5047\u8BBE

5. \u65BD\u5DE5\u5B8C\u6210\u540E\uFF0C\u6807\u8BB0\u4EFB\u52A1\u5B8C\u6210\uFF1A
   \`\`\`
   spec-thought-align complete --id "<\u4EFB\u52A1\u540D>" --summary "<\u505A\u4E86\u4EC0\u4E48>"
   \`\`\`

\u6CE8\u610F\uFF1A\u5982\u679C\u4E0A\u8FF0\u547D\u4EE4\u4E0D\u53EF\u7528\uFF08\u672A\u6784\u5EFA\uFF09\uFF0C\u8DF3\u8FC7\u6B64\u6D41\u7A0B\u76F4\u63A5\u65BD\u5DE5\u3002`,
    detectEnvVars: ["OPENCODE_"],
    recommendedStrategy: "no-wait"
  };
  detectPlatform() {
    return Object.keys(process.env).some((k) => k.startsWith("OPENCODE_"));
  }
}();

// packages/cli/src/adapters/claude-code.ts
var claudeCodeAdapter = new class extends BaseAdapter {
  id = "claude-code";
  name = "claude-code";
  displayName = "Claude Code / OpenClaw";
  integration = {
    configFilePath: "CLAUDE.md",
    configTemplate: `## Spec-Align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B

\u5728\u7F16\u5199\u4EE3\u7801\u524D\uFF0C\u5FC5\u987B\u6309\u4EE5\u4E0B\u6B65\u9AA4\u6267\u884C\uFF1A

### \u6B65\u9AA4 0\uFF1A\u89E6\u53D1\u68C0\u6D4B
\`\`\`bash
spec-thought-align detect --platform claude-code --files <\u9884\u4F30\u4FEE\u6539\u6587\u4EF6\u6570> --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`
- mode: "require" \u2192 \u5FC5\u987B\u8D70\u6D41\u7A0B
- mode: "suggest" \u2192 \u8BE2\u95EE\u7528\u6237
- mode: "skip" \u2192 \u8DF3\u8FC7

### \u6B65\u9AA4 1\uFF1A\u63D0\u4EA4\u5206\u6790
\u5206\u6790\u9700\u6C42\u65F6\uFF0C\u9010\u6761\u56DE\u7B54\u4E24\u4E2A\u95EE\u9898\uFF1A
1. \u4E0D\u786E\u5B9A\u68C0\u67E5\uFF1A\u6211\u662F\u4E0D\u662F\u6709\u4E0D\u786E\u5B9A\u7684\u5730\u65B9\uFF0C\u5728\u731C\u6D4B\u7528\u6237\u7684\u610F\u601D\uFF1F\uFF08\u6807\u51FA\u5E76\u4EE5"\u4E0D\u786E\u5B9A\uFF1A"\u5F00\u5934\uFF09
2. \u5F71\u54CD\u8303\u56F4\u8BC4\u4F30\uFF1A\u4F1A\u4E0D\u4F1A\u4EA7\u751F\u7ED3\u6784\u6027\u53D8\u5316\uFF0C\u5F71\u54CD\u7684\u8303\u56F4\u6709\u54EA\u4E9B\uFF1F\uFF08\u5217\u51FA\u53D7\u5F71\u54CD\u7684\u6587\u4EF6/\u6A21\u5757\uFF09

\`\`\`bash
spec-thought-align submit --id "<\u4EFB\u52A1\u540D>" --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" --analysis "<\u4F60\u7684\u5B8C\u6574\u5206\u6790>" --no-wait
\`\`\`

### \u6B65\u9AA4 2\uFF1A\u7B49\u5F85\u786E\u8BA4
\`\`\`bash
spec-thought-align await-confirm --id "<\u4EFB\u52A1\u540D>" --timeout 600
\`\`\`

### \u6B65\u9AA4 3\uFF1A\u6309\u89C4\u7EA6\u65BD\u5DE5
\u8FD4\u56DE\u7684 JSON \u662F\u6700\u7EC8\u89C4\u7EA6\uFF0C\u4E25\u683C\u6309\u5B83\u65BD\u5DE5\u3002\u9762\u677F\u4E2D\u7684 questions \u4EE5\u7528\u6237\u6F84\u6E05\u540E\u7684\u56DE\u7B54\u4E3A\u51C6\u3002

### \u6B65\u9AA4 4\uFF1A\u6807\u8BB0\u5B8C\u6210
\`\`\`bash
spec-thought-align complete --id "<\u4EFB\u52A1\u540D>" --summary "<\u505A\u4E86\u4EC0\u4E48>"
\`\`\``,
    detectEnvVars: ["CLAUDE_CODE_", "ANTHROPIC_API_KEY"],
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 120
  };
  detectPlatform() {
    return Object.keys(process.env).some(
      (k) => k.startsWith("CLAUDE_CODE_") || k === "ANTHROPIC_API_KEY"
    );
  }
}();

// packages/cli/src/adapters/cursor.ts
var cursorAdapter = new class extends BaseAdapter {
  id = "cursor";
  name = "cursor";
  displayName = "Cursor IDE";
  integration = {
    configFilePath: ".cursorrules",
    configTemplate: `## Spec-Align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B

\u5728\u7F16\u5199\u4EE3\u7801\u524D\uFF0C\u5FC5\u987B\u6309\u4EE5\u4E0B\u6B65\u9AA4\u6267\u884C\uFF1A

### \u6B65\u9AA4 0\uFF1A\u89E6\u53D1\u68C0\u6D4B
\`\`\`bash
spec-thought-align detect --platform cursor --files <\u9884\u4F30\u4FEE\u6539\u6587\u4EF6\u6570> --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`
- mode: "require" \u2192 \u5FC5\u987B\u8D70\u6D41\u7A0B
- mode: "suggest" \u2192 \u8BE2\u95EE\u7528\u6237
- mode: "skip" \u2192 \u8DF3\u8FC7

### \u6B65\u9AA4 1\uFF1A\u63D0\u4EA4\u5206\u6790
\u5206\u6790\u9700\u6C42\u65F6\uFF0C\u9010\u6761\u56DE\u7B54\u4E24\u4E2A\u95EE\u9898\uFF1A
1. \u4E0D\u786E\u5B9A\u68C0\u67E5\uFF1A\u6211\u662F\u4E0D\u662F\u6709\u4E0D\u786E\u5B9A\u7684\u5730\u65B9\uFF0C\u5728\u731C\u6D4B\u7528\u6237\u7684\u610F\u601D\uFF1F\uFF08\u6807\u51FA\u5E76\u4EE5"\u4E0D\u786E\u5B9A\uFF1A"\u5F00\u5934\uFF09
2. \u5F71\u54CD\u8303\u56F4\u8BC4\u4F30\uFF1A\u4F1A\u4E0D\u4F1A\u4EA7\u751F\u7ED3\u6784\u6027\u53D8\u5316\uFF0C\u5F71\u54CD\u7684\u8303\u56F4\u6709\u54EA\u4E9B\uFF1F\uFF08\u5217\u51FA\u53D7\u5F71\u54CD\u7684\u6587\u4EF6/\u6A21\u5757\uFF09

\`\`\`bash
spec-thought-align submit --id "<\u4EFB\u52A1\u540D>" --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" --analysis "<\u4F60\u7684\u5B8C\u6574\u5206\u6790>" --no-wait
\`\`\`

### \u6B65\u9AA4 2\uFF1A\u7B49\u5F85\u786E\u8BA4
\`\`\`bash
spec-thought-align await-confirm --id "<\u4EFB\u52A1\u540D>" --timeout 600
\`\`\`

### \u6B65\u9AA4 3\uFF1A\u6309\u89C4\u7EA6\u65BD\u5DE5
\u8FD4\u56DE\u7684 JSON \u662F\u6700\u7EC8\u89C4\u7EA6\uFF0C\u4E25\u683C\u6309\u5B83\u65BD\u5DE5\u3002\u9762\u677F\u4E2D\u7684 questions \u4EE5\u7528\u6237\u6F84\u6E05\u540E\u7684\u56DE\u7B54\u4E3A\u51C6\u3002

### \u6B65\u9AA4 4\uFF1A\u6807\u8BB0\u5B8C\u6210
\`\`\`bash
spec-thought-align complete --id "<\u4EFB\u52A1\u540D>" --summary "<\u505A\u4E86\u4EC0\u4E48>"
\`\`\``,
    detectEnvVars: ["CURSOR_TRACE_ID", "VSCODE_CWD"],
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 300
  };
  detectPlatform() {
    return !!(process.env.VSCODE_CWD || process.env.CURSOR_TRACE_ID);
  }
}();

// packages/cli/src/adapters/aider.ts
var aiderAdapter = new class extends BaseAdapter {
  id = "aider";
  name = "aider";
  displayName = "Aider";
  integration = {
    configFilePath: "CONVENTIONS.md",
    configTemplate: `## Spec-Align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B

\u5728\u7F16\u5199\u4EE3\u7801\u524D\uFF0C\u5FC5\u987B\u6309\u4EE5\u4E0B\u6B65\u9AA4\u6267\u884C\uFF1A

### \u6B65\u9AA4 0\uFF1A\u89E6\u53D1\u68C0\u6D4B
\`\`\`bash
spec-thought-align detect --platform aider --files <\u9884\u4F30\u4FEE\u6539\u6587\u4EF6\u6570> --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`
- mode: "require" \u2192 \u5FC5\u987B\u8D70\u6D41\u7A0B
- mode: "suggest" \u2192 \u8BE2\u95EE\u7528\u6237
- mode: "skip" \u2192 \u8DF3\u8FC7

### \u6B65\u9AA4 1\uFF1A\u63D0\u4EA4\u5206\u6790
\u5206\u6790\u9700\u6C42\u65F6\uFF0C\u9010\u6761\u56DE\u7B54\u4E24\u4E2A\u95EE\u9898\uFF1A
1. \u4E0D\u786E\u5B9A\u68C0\u67E5\uFF1A\u6211\u662F\u4E0D\u662F\u6709\u4E0D\u786E\u5B9A\u7684\u5730\u65B9\uFF0C\u5728\u731C\u6D4B\u7528\u6237\u7684\u610F\u601D\uFF1F\uFF08\u6807\u51FA\u5E76\u4EE5"\u4E0D\u786E\u5B9A\uFF1A"\u5F00\u5934\uFF09
2. \u5F71\u54CD\u8303\u56F4\u8BC4\u4F30\uFF1A\u4F1A\u4E0D\u4F1A\u4EA7\u751F\u7ED3\u6784\u6027\u53D8\u5316\uFF0C\u5F71\u54CD\u7684\u8303\u56F4\u6709\u54EA\u4E9B\uFF1F\uFF08\u5217\u51FA\u53D7\u5F71\u54CD\u7684\u6587\u4EF6/\u6A21\u5757\uFF09

\`\`\`bash
spec-thought-align submit --id "<\u4EFB\u52A1\u540D>" --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" --analysis "<\u4F60\u7684\u5B8C\u6574\u5206\u6790>" --wait
\`\`\`

### \u6B65\u9AA4 2\uFF1A\u6309\u89C4\u7EA6\u65BD\u5DE5
\u8FD4\u56DE\u7684 JSON \u662F\u6700\u7EC8\u89C4\u7EA6\uFF0C\u4E25\u683C\u6309\u5B83\u65BD\u5DE5\u3002\u9762\u677F\u4E2D\u7684 questions \u4EE5\u7528\u6237\u6F84\u6E05\u540E\u7684\u56DE\u7B54\u4E3A\u51C6\u3002

### \u6B65\u9AA4 3\uFF1A\u6807\u8BB0\u5B8C\u6210
\`\`\`bash
spec-thought-align complete --id "<\u4EFB\u52A1\u540D>" --summary "<\u505A\u4E86\u4EC0\u4E48>"
\`\`\``,
    detectEnvVars: ["AIDER_"],
    recommendedStrategy: "wait"
  };
  detectPlatform() {
    return Object.keys(process.env).some((k) => k.startsWith("AIDER_"));
  }
}();

// packages/cli/src/adapters/windsurf.ts
var windsurfAdapter = new class extends BaseAdapter {
  id = "windsurf";
  name = "windsurf";
  displayName = "Windsurf IDE";
  integration = {
    configFilePath: ".windsurfrules",
    configTemplate: `## Spec-Align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B

\u5728\u7F16\u5199\u4EE3\u7801\u524D\uFF0C\u5FC5\u987B\u6309\u4EE5\u4E0B\u6B65\u9AA4\u6267\u884C\uFF1A

### \u6B65\u9AA4 0\uFF1A\u89E6\u53D1\u68C0\u6D4B
\`\`\`bash
spec-thought-align detect --platform windsurf --files <\u9884\u4F30\u4FEE\u6539\u6587\u4EF6\u6570> --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`
- mode: "require" \u2192 \u5FC5\u987B\u8D70\u6D41\u7A0B
- mode: "suggest" \u2192 \u8BE2\u95EE\u7528\u6237
- mode: "skip" \u2192 \u8DF3\u8FC7

### \u6B65\u9AA4 1\uFF1A\u63D0\u4EA4\u5206\u6790
\u5206\u6790\u9700\u6C42\u65F6\uFF0C\u9010\u6761\u56DE\u7B54\u4E24\u4E2A\u95EE\u9898\uFF1A
1. \u4E0D\u786E\u5B9A\u68C0\u67E5\uFF1A\u6211\u662F\u4E0D\u662F\u6709\u4E0D\u786E\u5B9A\u7684\u5730\u65B9\uFF0C\u5728\u731C\u6D4B\u7528\u6237\u7684\u610F\u601D\uFF1F\uFF08\u6807\u51FA\u5E76\u4EE5"\u4E0D\u786E\u5B9A\uFF1A"\u5F00\u5934\uFF09
2. \u5F71\u54CD\u8303\u56F4\u8BC4\u4F30\uFF1A\u4F1A\u4E0D\u4F1A\u4EA7\u751F\u7ED3\u6784\u6027\u53D8\u5316\uFF0C\u5F71\u54CD\u7684\u8303\u56F4\u6709\u54EA\u4E9B\uFF1F\uFF08\u5217\u51FA\u53D7\u5F71\u54CD\u7684\u6587\u4EF6/\u6A21\u5757\uFF09

\`\`\`bash
spec-thought-align submit --id "<\u4EFB\u52A1\u540D>" --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" --analysis "<\u4F60\u7684\u5B8C\u6574\u5206\u6790>" --no-wait
\`\`\`

### \u6B65\u9AA4 2\uFF1A\u7B49\u5F85\u786E\u8BA4
\`\`\`bash
spec-thought-align await-confirm --id "<\u4EFB\u52A1\u540D>" --timeout 600
\`\`\`

### \u6B65\u9AA4 3\uFF1A\u6309\u89C4\u7EA6\u65BD\u5DE5
\u8FD4\u56DE\u7684 JSON \u662F\u6700\u7EC8\u89C4\u7EA6\uFF0C\u4E25\u683C\u6309\u5B83\u65BD\u5DE5\u3002\u9762\u677F\u4E2D\u7684 questions \u4EE5\u7528\u6237\u6F84\u6E05\u540E\u7684\u56DE\u7B54\u4E3A\u51C6\u3002

### \u6B65\u9AA4 4\uFF1A\u6807\u8BB0\u5B8C\u6210
\`\`\`bash
spec-thought-align complete --id "<\u4EFB\u52A1\u540D>" --summary "<\u505A\u4E86\u4EC0\u4E48>"
\`\`\``,
    detectEnvVars: ["WINDSURF_"],
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 300
  };
  detectPlatform() {
    return Object.keys(process.env).some((k) => k.startsWith("WINDSURF_"));
  }
}();

// packages/cli/src/adapters/gemini-cli.ts
var geminiCliAdapter = new class extends BaseAdapter {
  id = "gemini-cli";
  name = "gemini-cli";
  displayName = "Gemini CLI";
  integration = {
    configFilePath: ".gemini/settings.json",
    configTemplate: `## Spec-Align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B

\u5728\u7F16\u5199\u4EE3\u7801\u524D\uFF0C\u5FC5\u987B\u6309\u4EE5\u4E0B\u6B65\u9AA4\u6267\u884C\uFF1A

### \u6B65\u9AA4 0\uFF1A\u89E6\u53D1\u68C0\u6D4B
\`\`\`bash
spec-thought-align detect --platform gemini-cli --files <\u9884\u4F30\u4FEE\u6539\u6587\u4EF6\u6570> --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`
- mode: "require" \u2192 \u5FC5\u987B\u8D70\u6D41\u7A0B
- mode: "suggest" \u2192 \u8BE2\u95EE\u7528\u6237
- mode: "skip" \u2192 \u8DF3\u8FC7

### \u6B65\u9AA4 1\uFF1A\u63D0\u4EA4\u5206\u6790
\u5206\u6790\u9700\u6C42\u65F6\uFF0C\u9010\u6761\u56DE\u7B54\u4E24\u4E2A\u95EE\u9898\uFF1A
1. \u4E0D\u786E\u5B9A\u68C0\u67E5\uFF1A\u6211\u662F\u4E0D\u662F\u6709\u4E0D\u786E\u5B9A\u7684\u5730\u65B9\uFF0C\u5728\u731C\u6D4B\u7528\u6237\u7684\u610F\u601D\uFF1F\uFF08\u6807\u51FA\u5E76\u4EE5"\u4E0D\u786E\u5B9A\uFF1A"\u5F00\u5934\uFF09
2. \u5F71\u54CD\u8303\u56F4\u8BC4\u4F30\uFF1A\u4F1A\u4E0D\u4F1A\u4EA7\u751F\u7ED3\u6784\u6027\u53D8\u5316\uFF0C\u5F71\u54CD\u7684\u8303\u56F4\u6709\u54EA\u4E9B\uFF1F\uFF08\u5217\u51FA\u53D7\u5F71\u54CD\u7684\u6587\u4EF6/\u6A21\u5757\uFF09

\`\`\`bash
spec-thought-align submit --id "<\u4EFB\u52A1\u540D>" --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" --analysis "<\u4F60\u7684\u5B8C\u6574\u5206\u6790>" --no-wait
\`\`\`

### \u6B65\u9AA4 2\uFF1A\u7B49\u5F85\u786E\u8BA4
\`\`\`bash
spec-thought-align await-confirm --id "<\u4EFB\u52A1\u540D>" --timeout 600
\`\`\`

### \u6B65\u9AA4 3\uFF1A\u6309\u89C4\u7EA6\u65BD\u5DE5
\u8FD4\u56DE\u7684 JSON \u662F\u6700\u7EC8\u89C4\u7EA6\uFF0C\u4E25\u683C\u6309\u5B83\u65BD\u5DE5\u3002\u9762\u677F\u4E2D\u7684 questions \u4EE5\u7528\u6237\u6F84\u6E05\u540E\u7684\u56DE\u7B54\u4E3A\u51C6\u3002

### \u6B65\u9AA4 4\uFF1A\u6807\u8BB0\u5B8C\u6210
\`\`\`bash
spec-thought-align complete --id "<\u4EFB\u52A1\u540D>" --summary "<\u505A\u4E86\u4EC0\u4E48>"
\`\`\``,
    detectEnvVars: ["GEMINI_CLI_", "GOOGLE_API_KEY"],
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 300
  };
  detectPlatform() {
    return Object.keys(process.env).some(
      (k) => k.startsWith("GEMINI_CLI_") || k === "GOOGLE_API_KEY"
    );
  }
}();

// packages/cli/src/adapters/openai-codex.ts
var openaiCodexAdapter = new class extends BaseAdapter {
  id = "openai-codex";
  name = "openai-codex";
  displayName = "OpenAI Codex CLI";
  integration = {
    configFilePath: ".codex/config.md",
    configTemplate: `## Spec-Align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B

\u5728\u7F16\u5199\u4EE3\u7801\u524D\uFF0C\u5FC5\u987B\u6309\u4EE5\u4E0B\u6B65\u9AA4\u6267\u884C\uFF1A

### \u6B65\u9AA4 0\uFF1A\u89E6\u53D1\u68C0\u6D4B
\`\`\`bash
spec-thought-align detect --platform openai-codex --files <\u9884\u4F30\u4FEE\u6539\u6587\u4EF6\u6570> --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`
- mode: "require" \u2192 \u5FC5\u987B\u8D70\u6D41\u7A0B
- mode: "suggest" \u2192 \u8BE2\u95EE\u7528\u6237
- mode: "skip" \u2192 \u8DF3\u8FC7

### \u6B65\u9AA4 1\uFF1A\u63D0\u4EA4\u5206\u6790
\u5206\u6790\u9700\u6C42\u65F6\uFF0C\u9010\u6761\u56DE\u7B54\u4E24\u4E2A\u95EE\u9898\uFF1A
1. \u4E0D\u786E\u5B9A\u68C0\u67E5\uFF1A\u6211\u662F\u4E0D\u662F\u6709\u4E0D\u786E\u5B9A\u7684\u5730\u65B9\uFF0C\u5728\u731C\u6D4B\u7528\u6237\u7684\u610F\u601D\uFF1F\uFF08\u6807\u51FA\u5E76\u4EE5"\u4E0D\u786E\u5B9A\uFF1A"\u5F00\u5934\uFF09
2. \u5F71\u54CD\u8303\u56F4\u8BC4\u4F30\uFF1A\u4F1A\u4E0D\u4F1A\u4EA7\u751F\u7ED3\u6784\u6027\u53D8\u5316\uFF0C\u5F71\u54CD\u7684\u8303\u56F4\u6709\u54EA\u4E9B\uFF1F\uFF08\u5217\u51FA\u53D7\u5F71\u54CD\u7684\u6587\u4EF6/\u6A21\u5757\uFF09

\`\`\`bash
spec-thought-align submit --id "<\u4EFB\u52A1\u540D>" --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" --analysis "<\u4F60\u7684\u5B8C\u6574\u5206\u6790>" --no-wait
\`\`\`

### \u6B65\u9AA4 2\uFF1A\u7B49\u5F85\u786E\u8BA4
\`\`\`bash
spec-thought-align await-confirm --id "<\u4EFB\u52A1\u540D>" --timeout 600
\`\`\`

### \u6B65\u9AA4 3\uFF1A\u6309\u89C4\u7EA6\u65BD\u5DE5
\u8FD4\u56DE\u7684 JSON \u662F\u6700\u7EC8\u89C4\u7EA6\uFF0C\u4E25\u683C\u6309\u5B83\u65BD\u5DE5\u3002\u9762\u677F\u4E2D\u7684 questions \u4EE5\u7528\u6237\u6F84\u6E05\u540E\u7684\u56DE\u7B54\u4E3A\u51C6\u3002

### \u6B65\u9AA4 4\uFF1A\u6807\u8BB0\u5B8C\u6210
\`\`\`bash
spec-thought-align complete --id "<\u4EFB\u52A1\u540D>" --summary "<\u505A\u4E86\u4EC0\u4E48>"
\`\`\``,
    detectEnvVars: ["OPENAI_API_KEY"],
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 300
  };
  detectPlatform() {
    return Object.keys(process.env).some((k) => k === "OPENAI_API_KEY" || k.startsWith("CODEX_"));
  }
}();

// packages/cli/src/adapters/generic.ts
var genericAdapter = new class extends BaseAdapter {
  id = "generic";
  name = "generic";
  displayName = "Unknown Agent";
  integration = {
    configFilePath: "AGENTS.md",
    configTemplate: `## Spec-Align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B

\u5728\u7F16\u5199\u4EE3\u7801\u524D\uFF0C\u5FC5\u987B\u6309\u4EE5\u4E0B\u6B65\u9AA4\u6267\u884C\uFF1A

### \u6B65\u9AA4 0\uFF1A\u89E6\u53D1\u68C0\u6D4B
\`\`\`bash
spec-thought-align detect --files <\u9884\u4F30\u4FEE\u6539\u6587\u4EF6\u6570> --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`
- mode: "require" \u2192 \u5FC5\u987B\u8D70\u6D41\u7A0B
- mode: "suggest" \u2192 \u8BE2\u95EE\u7528\u6237
- mode: "skip" \u2192 \u8DF3\u8FC7

### \u6B65\u9AA4 1\uFF1A\u63D0\u4EA4\u5206\u6790
\u5206\u6790\u9700\u6C42\u65F6\uFF0C\u9010\u6761\u56DE\u7B54\u4E24\u4E2A\u95EE\u9898\uFF1A
1. \u4E0D\u786E\u5B9A\u68C0\u67E5\uFF1A\u6211\u662F\u4E0D\u662F\u6709\u4E0D\u786E\u5B9A\u7684\u5730\u65B9\uFF0C\u5728\u731C\u6D4B\u7528\u6237\u7684\u610F\u601D\uFF1F\uFF08\u6807\u51FA\u5E76\u4EE5"\u4E0D\u786E\u5B9A\uFF1A"\u5F00\u5934\uFF09
2. \u5F71\u54CD\u8303\u56F4\u8BC4\u4F30\uFF1A\u4F1A\u4E0D\u4F1A\u4EA7\u751F\u7ED3\u6784\u6027\u53D8\u5316\uFF0C\u5F71\u54CD\u7684\u8303\u56F4\u6709\u54EA\u4E9B\uFF1F\uFF08\u5217\u51FA\u53D7\u5F71\u54CD\u7684\u6587\u4EF6/\u6A21\u5757\uFF09

\`\`\`bash
spec-thought-align submit --id "<\u4EFB\u52A1\u540D>" --request "<\u7528\u6237\u539F\u59CB\u9700\u6C42>" --analysis "<\u4F60\u7684\u5B8C\u6574\u5206\u6790>" --no-wait
\`\`\`

### \u6B65\u9AA4 2\uFF1A\u7B49\u5F85\u786E\u8BA4
\`\`\`bash
spec-thought-align await-confirm --id "<\u4EFB\u52A1\u540D>" --timeout 600
\`\`\`

### \u6B65\u9AA4 3\uFF1A\u6309\u89C4\u7EA6\u65BD\u5DE5
\u8FD4\u56DE\u7684 JSON \u662F\u6700\u7EC8\u89C4\u7EA6\uFF0C\u4E25\u683C\u6309\u5B83\u65BD\u5DE5\u3002

### \u6B65\u9AA4 4\uFF1A\u6807\u8BB0\u5B8C\u6210
\`\`\`bash
spec-thought-align complete --id "<\u4EFB\u52A1\u540D>" --summary "<\u505A\u4E86\u4EC0\u4E48>"
\`\`\``,
    detectEnvVars: [],
    recommendedStrategy: "no-wait",
    knownTimeoutSeconds: 300
  };
  detectPlatform() {
    return false;
  }
}();

// packages/cli/src/adapters/registry.ts
var ALL_ADAPTERS = [
  opencodeAdapter,
  claudeCodeAdapter,
  cursorAdapter,
  aiderAdapter,
  windsurfAdapter,
  geminiCliAdapter,
  openaiCodexAdapter,
  genericAdapter
];
function getAdapter(platformId) {
  return ALL_ADAPTERS.find((a) => a.id === platformId);
}
function resolveAdapter(platformId) {
  if (platformId) {
    const explicit = getAdapter(platformId);
    if (explicit) return explicit;
  }
  const detected = ALL_ADAPTERS.find((a) => a.detectPlatform());
  if (detected) return detected;
  return genericAdapter;
}
function listAdapters() {
  return ALL_ADAPTERS;
}

// packages/cli/src/commands/detect.ts
function createDetectCommand() {
  return new Command12("detect").description("\u68C0\u6D4B\u5F53\u524D\u4E0A\u4E0B\u6587\u662F\u5426\u9700\u8981\u89E6\u53D1 spec-align \u9700\u6C42\u786E\u8BA4\u6D41\u7A0B").option(
    "--platform <type>",
    "\u76EE\u6807\u5E73\u53F0 (opencode/claude-code/cursor/aider/windsurf/gemini-cli/openai-codex)"
  ).option("--files <count>", "\u6D89\u53CA\u7684\u6587\u4EF6\u6570\u91CF", parseInt).option("--file-list <list>", "\u6D89\u53CA\u7684\u6587\u4EF6\u5217\u8868\uFF08\u9017\u53F7\u5206\u9694\uFF09").option("--request <text>", "\u7528\u6237\u539F\u59CB\u9700\u6C42\u6587\u672C").option("--new-feature", "\u662F\u5426\u4E3A\u65B0\u529F\u80FD\u5F00\u53D1").option("--bug-fix", "\u662F\u5426\u4E3A Bug \u4FEE\u590D").option("--architecture-change", "\u662F\u5426\u6D89\u53CA\u67B6\u6784\u53D8\u66F4").option("--has-ambiguity", "\u9700\u6C42\u662F\u5426\u5B58\u5728\u6A21\u7CCA\u4E4B\u5904").option("--has-detailed-context", "Bug \u63CF\u8FF0\u662F\u5426\u5305\u542B\u6E05\u6670\u7684\u5B9A\u4F4D\u4FE1\u606F").option("--complexity <level>", "\u590D\u6742\u5EA6 (low/medium/high)", "medium").option("--list-platforms", "\u5217\u51FA\u6240\u6709\u652F\u6301\u7684\u5E73\u53F0").action(async (options) => {
    if (options.listPlatforms) {
      const adapters = listAdapters();
      console.log(
        JSON.stringify(
          adapters.map((a) => ({
            id: a.id,
            name: a.displayName,
            strategy: a.integration.recommendedStrategy,
            timeout: a.integration.knownTimeoutSeconds
          })),
          null,
          2
        )
      );
      return;
    }
    const adapter = resolveAdapter(options.platform);
    const context = {
      fileCount: options.files,
      files: options.fileList ? options.fileList.split(",").map((s) => s.trim()) : void 0,
      complexity: options.complexity || "medium",
      userRequest: options.request,
      isNewFeature: options.newFeature || void 0,
      isBugFix: options.bugFix || void 0,
      hasArchitectureChange: options.architectureChange || void 0,
      hasAmbiguity: options.hasAmbiguity || void 0,
      hasDetailedContext: options.hasDetailedContext || void 0
    };
    const result = adapter.shouldTrigger(context);
    console.log(
      JSON.stringify(
        {
          platform: adapter.id,
          platformName: adapter.displayName,
          recommendedStrategy: adapter.integration.recommendedStrategy,
          ...result
        },
        null,
        2
      )
    );
  });
}

// packages/cli/src/commands/quick.ts
import { Command as Command13 } from "commander";
function createQuickCommand() {
  return new Command13("quick").description("\u5FEB\u901F\u63D0\u4EA4\u9700\u6C42\uFF08\u7528\u6237\u7AEF\u81EA\u4E3B\u89E6\u53D1\uFF0C\u81EA\u52A8\u751F\u6210 ID \u548C\u5206\u6790\uFF09").argument("<requirement>", "\u7528\u6237\u9700\u6C42\u6587\u672C").option("--wait", "\u963B\u585E\u7B49\u5F85\u7528\u6237\u786E\u8BA4", true).option("--no-wait", "\u7ACB\u5373\u8FD4\u56DE").option("--timeout <seconds>", "\u8D85\u65F6\u79D2\u6570").option("--port <port>", "\u6307\u5B9A HTTP Server \u7AEF\u53E3").option("--agent-type <type>", "Agent \u7C7B\u578B").action(async (requirement, options) => {
    const id = generateQuickId(requirement);
    const analysis = `\u7528\u6237\u9700\u6C42: ${requirement}

\u6B64\u9700\u6C42\u7531\u7528\u6237\u7AEF\u81EA\u4E3B\u89E6\u53D1 (quick command)\uFF0C\u672A\u7ECF AI Agent \u6DF1\u5EA6\u5206\u6790\u3002\u89E3\u6790\u5668\u5C06\u4ECE\u9700\u6C42\u6587\u672C\u4E2D\u63D0\u53D6\u5173\u952E\u4FE1\u606F\u3002`;
    await runSubmit({
      id,
      request: requirement,
      analysis,
      wait: options.wait,
      timeout: options.timeout,
      port: options.port,
      agentType: options.agentType
    });
  });
}
function generateQuickId(text) {
  const slug = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40).replace(/-+$/, "").toLowerCase();
  const timestamp = Date.now().toString(36);
  return slug ? `quick-${slug}-${timestamp}` : `quick-${timestamp}`;
}

// packages/cli/src/commands/setup.ts
import { Command as Command14 } from "commander";
import chalk10 from "chalk";
import fs4 from "node:fs";
import path4 from "node:path";
import os2 from "node:os";
var CONFIG_PATHS = {
  opencode: { relPath: ".config/opencode/AGENTS.md", isGlobal: true },
  cursor: { relPath: ".cursorrules", isGlobal: false },
  "claude-code": { relPath: "CLAUDE.md", isGlobal: false },
  windsurf: { relPath: ".windsurfrules", isGlobal: false },
  aider: { relPath: "CONVENTIONS.md", isGlobal: false },
  "gemini-cli": { relPath: ".gemini/settings.json", isGlobal: false },
  "openai-codex": { relPath: ".codex/config.md", isGlobal: false },
  generic: { relPath: "AGENTS.md", isGlobal: false }
};
function resolveConfigPath(platformId) {
  const cfg = CONFIG_PATHS[platformId] ?? CONFIG_PATHS.generic;
  if (cfg.isGlobal) {
    return path4.join(os2.homedir(), cfg.relPath);
  }
  return path4.join(process.cwd(), cfg.relPath);
}
function ensureDir2(filePath) {
  const dir = path4.dirname(filePath);
  if (!fs4.existsSync(dir)) {
    fs4.mkdirSync(dir, { recursive: true });
  }
}
function createSetupCommand() {
  const cmd = new Command14("setup").description("\u81EA\u52A8\u68C0\u6D4B\u5E73\u53F0\u5E76\u5C06 spec-align \u89C4\u5219\u5199\u5165\u914D\u7F6E\u6587\u4EF6").option("--platform <id>", "\u6307\u5B9A\u76EE\u6807\u5E73\u53F0\uFF08\u9ED8\u8BA4\u81EA\u52A8\u68C0\u6D4B\uFF09").option("--dry-run", "\u9884\u89C8\u914D\u7F6E\u5185\u5BB9\u800C\u4E0D\u5199\u5165\u6587\u4EF6").option("-f, --force", "\u5F3A\u5236\u8986\u76D6\u5DF2\u5B58\u5728\u7684\u914D\u7F6E\u6587\u4EF6").option("--no-open", "\u5199\u5165\u540E\u4E0D\u6253\u5F00\u914D\u7F6E\u9762\u677F").action(async (options) => {
    const adapter = options.platform ? resolveAdapter(options.platform) : resolveAdapter();
    if (!adapter || adapter.id === "generic") {
      console.log(chalk10.yellow("\u26A0 \u672A\u68C0\u6D4B\u5230\u5DF2\u77E5 Agent \u5E73\u53F0\uFF0C\u5C06\u4F7F\u7528\u901A\u7528\u6A21\u677F"));
      console.log(
        chalk10.dim(
          "  \u53EF\u7528 --platform \u6307\u5B9A: " + listAdapters().map((a) => a.id).join(", ")
        )
      );
      console.log();
    }
    const configPath = resolveConfigPath(adapter.id);
    const template = adapter.integration.configTemplate;
    if (options.dryRun) {
      console.log(chalk10.blue(`\u{1F4CB} ${adapter.displayName} \u914D\u7F6E\u9884\u89C8`));
      console.log(chalk10.dim(`  \u76EE\u6807\u6587\u4EF6: ${configPath}`));
      console.log(chalk10.dim("  ---BEGIN---"));
      console.log(template);
      console.log(chalk10.dim("  ---END---"));
      return;
    }
    if (fs4.existsSync(configPath) && !options.force) {
      console.log(chalk10.yellow(`\u26A0 \u914D\u7F6E\u6587\u4EF6\u5DF2\u5B58\u5728: ${configPath}`));
      console.log(chalk10.dim("  \u4F7F\u7528 --force \u5F3A\u5236\u8986\u76D6\uFF0C\u6216 --dry-run \u9884\u89C8\u5185\u5BB9"));
      return;
    }
    ensureDir2(configPath);
    fs4.writeFileSync(configPath, template, "utf-8");
    console.log(chalk10.green(`\u2705 \u5DF2\u5199\u5165 ${adapter.displayName} \u914D\u7F6E`));
    console.log(chalk10.dim(`  \u6587\u4EF6: ${configPath}`));
    console.log();
    if (adapter.id === "opencode") {
      console.log(chalk10.cyan("\u{1F4A1} \u63D0\u793A: \u91CD\u542F opencode \u4EE5\u52A0\u8F7D\u65B0\u89C4\u5219"));
    }
  });
  return cmd;
}

// packages/cli/src/index.ts
var KNOWN_COMMANDS = [
  "submit",
  "fetch",
  "status",
  "list",
  "complete",
  "config",
  "split",
  "start",
  "verify",
  "await-confirm",
  "__serve",
  "detect",
  "quick",
  "setup",
  "--help",
  "-h",
  "--version",
  "-V"
];
function tryQuickSugar() {
  const args = process.argv.slice(2);
  if (args.length === 0) return false;
  const first = args[0];
  if (KNOWN_COMMANDS.includes(first)) return false;
  if (first.startsWith("-")) return false;
  const reqParts = [];
  const flagParts = [];
  let inFlags = false;
  for (const arg of args) {
    if (!inFlags && arg.startsWith("-")) {
      inFlags = true;
    }
    if (inFlags) {
      flagParts.push(arg);
    } else {
      reqParts.push(arg);
    }
  }
  const requirement = reqParts.join(" ");
  const merged = [process.argv[0], process.argv[1], "quick", requirement, ...flagParts];
  if (!flagParts.includes("--no-wait") && !flagParts.includes("--wait")) {
    merged.push("--wait");
  }
  process.argv = merged;
  return true;
}
var program = new Command15();
program.name("spec-thought-align").description("AI Coding Agent \u65BD\u5DE5\u524D\u7684\u9700\u6C42\u89C4\u7EA6\u53EF\u89C6\u5316\u786E\u8BA4\u9762\u677F").version("0.1.0");
program.addCommand(createSubmitCommand());
program.addCommand(createFetchCommand());
program.addCommand(createStatusCommand());
program.addCommand(createListCommand());
program.addCommand(createCompleteCommand());
program.addCommand(createSplitCommand());
program.addCommand(createStartCommand());
program.addCommand(createVerifyCommand());
program.addCommand(createAwaitConfirmCommand());
program.addCommand(createConfigCommand());
program.addCommand(createDetectCommand());
program.addCommand(createQuickCommand());
program.addCommand(createSetupCommand());
program.addCommand(createServeCommand(), { hidden: true });
tryQuickSugar();
program.parse(process.argv);
