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
var STORAGE_DIR, INPUT_FILE, SPEC_FILE, STATUS_FILE, TASKS_FILE, EXIT_CODES, DEFAULT_TIMEOUT_SECONDS, POLL_INTERVAL_MS;
var init_constants = __esm({
  "packages/shared/src/constants.ts"() {
    "use strict";
    STORAGE_DIR = ".spec-align";
    INPUT_FILE = "input.json";
    SPEC_FILE = "spec.json";
    STATUS_FILE = "status.json";
    TASKS_FILE = "tasks.json";
    EXIT_CODES = {
      CONFIRMED: 0,
      TIMEOUT: 1,
      CANCELLED: 2,
      ERROR: 3
    };
    DEFAULT_TIMEOUT_SECONDS = 600;
    POLL_INTERVAL_MS = 2e3;
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
  readSpec: () => readSpec,
  readStatus: () => readStatus,
  readTaskManifest: () => readTaskManifest,
  taskExists: () => taskExists,
  updateSubTask: () => updateSubTask,
  writeInput: () => writeInput,
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
  const data = {
    status,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
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
import { Command as Command10 } from "commander";

// packages/cli/src/commands/submit.ts
init_src();
init_storage();
import { Command } from "commander";
import chalk from "chalk";

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
  return html.replace(
    "</head>",
    `<script>window.TASK_ID="${taskId}";</script></head>`
  );
}
async function ensureServer(requestedPort) {
  if (server && currentPort > 0) {
    return currentPort;
  }
  const app = new Hono();
  const uiDistPath = getUiDistPath();
  if (fs2.existsSync(uiDistPath)) {
    app.use("/assets/*", serveStatic({ root: uiDistPath }));
    app.use("/*", serveStatic({ root: uiDistPath, rewriteRequestPath: (p) => p }));
  }
  app.get("/task/:id", (c) => {
    const taskId = c.req.param("id");
    return c.html(serveUiPage(taskId));
  });
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
      console.error(`[server] GET /api/task/${taskId} error:`, err);
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
      console.error(`[server] POST /api/task/${taskId}/spec error:`, err);
      return c.json({ success: false, error: "Failed to save spec" }, 500);
    }
  });
  app.post("/api/task/:id/confirm", (c) => {
    const taskId = c.req.param("id");
    try {
      writeStatus(taskId, "confirmed");
      const spec = readSpec(taskId);
      spec.meta.status = "confirmed";
      spec.meta.confirmedAt = (/* @__PURE__ */ new Date()).toISOString();
      writeSpec(taskId, spec);
      return c.json({ success: true, message: "\u5DF2\u786E\u8BA4" });
    } catch (err) {
      console.error(`[server] POST /api/task/${taskId}/confirm error:`, err);
      return c.json({ success: false, error: "Failed to confirm task" }, 500);
    }
  });
  app.post("/api/task/:id/cancel", (c) => {
    const taskId = c.req.param("id");
    try {
      writeStatus(taskId, "cancelled");
      return c.json({ success: true, message: "\u5DF2\u53D6\u6D88" });
    } catch (err) {
      console.error(`[server] POST /api/task/${taskId}/cancel error:`, err);
      return c.json({ success: false, error: "Failed to cancel task" }, 500);
    }
  });
  app.get("/api/tasks", (_c) => {
    try {
      const tasks = listAllTasks();
      return Response.json({ success: true, data: tasks });
    } catch (err) {
      console.error("[server] GET /api/tasks error:", err);
      return Response.json({ success: false, error: "Failed to list tasks" }, { status: 500 });
    }
  });
  const port = requestedPort || 5678;
  return new Promise((resolve, reject) => {
    const tryPort = (p) => {
      const s = serve(
        { fetch: app.fetch, port: p },
        (info) => {
          currentPort = info.port;
          resolve(info.port);
        }
      );
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
  return entries.filter((e) => e.isDirectory()).map((e) => {
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
  result.assumptions = result.assumptions.filter((a) => a.text.length > 3 && !isSectionHeader(a.text));
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
var SECTION_HEADER_REGEX = new RegExp("^(\u4E0D\u786E\u5B9A|\u6280\u672F\u65B9\u6848|\u4E0D\u505A|\u9ED8\u8BA4\u5047\u8BBE|\u9700\u8981\u786E\u8BA4|\u4EE5\u4E0B|\u7406\u89E3\u9700\u8981)[\u7684\uFF1A:\\s]*$");
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
  const firstPara = segments.find((s) => !s.isHeader && s.text.length > 8 && !/^\d+[.)、]\s*/.test(s.text) && !/^(以下|方案|根因|实际|例如|故|所谓)/.test(s.text) && !s.text.endsWith("\uFF1A") && !s.text.endsWith(":"));
  if (firstPara && firstPara.text.length > 5) {
    return firstPara.text.length > 80 ? firstPara.text.slice(0, 80) + "..." : firstPara.text;
  }
  return request || "";
}
function extractContext(segments) {
  const contextParts = segments.filter((s) => s.type === "paragraph" && !s.isHeader && s.text.length > 10 && !isSectionHeader(s.text) && !s.text.endsWith("\uFF1F") && !s.text.endsWith("?") && !/^[/、，,•·]/.test(s.text) && !/^(或[者]?|还是|还有|以及)/.test(s.text)).slice(0, 3).map((s) => s.text);
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
  if (lower.includes("\u53EF\u80FD") || lower.includes("\u5E94\u8BE5") || lower.includes("\u901A\u5E38") || lower.includes("\u4E00\u822C")) return "medium";
  return "medium";
}
var HIGH_CONFIDENCE_WORDS = ["\u80AF\u5B9A", "\u786E\u5B9A", "\u663E\u7136", "\u5C31\u662F", "\u5DF2\u7ECF", "\u4E00\u5B9A"];
var LOW_CONFIDENCE_WORDS = ["\u4E0D\u786E\u5B9A", "\u4E0D\u6E05\u695A", "\u6CA1\u63D0\u5230", "\u6CA1\u8BF4", "\u4E5F\u8BB8", "\u53EF\u80FD\u5427", "\u4E0D\u77E5\u9053", "\u731C\u6D4B", "\u5927\u6982", "\u4F30\u8BA1"];
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
  if (spec.io.acceptanceCriteria.length === 0) spec.io.acceptanceCriteria = parsed.acceptanceCriteria;
  return spec;
}

// packages/cli/src/commands/submit.ts
function createSubmitCommand() {
  return new Command("submit").description("\u63D0\u4EA4\u9700\u6C42\u89C4\u7EA6\u5E76\u7B49\u5F85\u7528\u6237\u786E\u8BA4").requiredOption("--id <id>", "\u4EFB\u52A1\u552F\u4E00\u6807\u8BC6").requiredOption("--request <text>", "\u7528\u6237\u539F\u59CB\u9700\u6C42").requiredOption("--analysis <text>", "Agent \u7684\u601D\u8003\u5206\u6790").option("--wait", "\u963B\u585E\u7B49\u5F85\u7528\u6237\u786E\u8BA4", true).option("--no-wait", "\u7ACB\u5373\u8FD4\u56DE\uFF0C\u4E0D\u7B49\u5F85").option("--timeout <seconds>", "\u8D85\u65F6\u79D2\u6570", String(DEFAULT_TIMEOUT_SECONDS)).option("--port <port>", "\u6307\u5B9A HTTP Server \u7AEF\u53E3").option("--agent-type <type>", "\u6765\u6E90 Agent \u7C7B\u578B (cline/cursor/aider/...)").action(async (options) => {
    const {
      id: taskId,
      request,
      analysis,
      wait: shouldWait,
      timeout: timeoutStr,
      port: portStr,
      agentType
    } = options;
    const timeout = parseInt(timeoutStr, 10);
    const port = portStr ? parseInt(portStr, 10) : void 0;
    const basePath = getStorageBasePath();
    console.log(chalk.blue(`
\u{1F4CB} Spec-Align: ${taskId}`));
    console.log(chalk.gray(`  \u5199\u5165\u539F\u59CB\u5206\u6790...`));
    writeInput(taskId, { request, analysis, agentType }, basePath);
    console.log(chalk.gray(`  \u521B\u5EFA\u7ED3\u6784\u5316\u89C4\u7EA6...`));
    const spec = createEmptySpec(taskId, request, analysis, agentType);
    console.log(chalk.gray(`  \u89C4\u5219\u5F15\u64CE\u89E3\u6790\u4E2D...`));
    fillSpecFromAnalysis(spec);
    writeSpec(taskId, spec, basePath);
    writeStatus(taskId, "pending", basePath);
    const serverPort = await ensureServer(port);
    const panelUrl = `http://localhost:${serverPort}/task/${taskId}`;
    console.log(chalk.green(`
\u2705 \u89C4\u7EA6\u5DF2\u521B\u5EFA: ${taskId}`));
    console.log(chalk.cyan(`\u{1F310} \u53EF\u89C6\u5316\u9762\u677F: ${panelUrl}`));
    await openBrowser(panelUrl);
    if (!shouldWait) {
      console.log(chalk.gray(`
\u23E9 Server \u5DF2\u542F\u52A8\uFF08--no-wait \u6A21\u5F0F\uFF09`));
      console.log(chalk.gray(`   \u9762\u677F: ${panelUrl}`));
      console.log(chalk.gray(`   \u6309 Ctrl+C \u505C\u6B62 Server`));
      return;
    }
    console.log(chalk.yellow(`
\u23F3 \u7B49\u5F85\u7528\u6237\u786E\u8BA4... (\u8D85\u65F6: ${timeout}s)`));
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
          console.log(chalk.green(`
\u2705 \u7528\u6237\u5DF2\u786E\u8BA4\u89C4\u7EA6\uFF01`));
          console.log(JSON.stringify(finalSpec, null, 2));
          process.exit(EXIT_CODES.CONFIRMED);
        }
        if (currentStatus === "cancelled") {
          console.log(chalk.red(`
\u274C \u7528\u6237\u5DF2\u53D6\u6D88`));
          process.exit(EXIT_CODES.CANCELLED);
        }
        if (currentStatus !== lastStatus) {
          lastStatus = currentStatus;
        }
      } catch {
      }
      await sleep(POLL_INTERVAL_MS);
    }
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
import { Command as Command6 } from "commander";
import chalk5 from "chalk";
function createConfigCommand() {
  const cmd = new Command6("config").description("\u67E5\u770B\u6216\u4FEE\u6539\u914D\u7F6E");
  cmd.command("show").description("\u67E5\u770B\u5F53\u524D\u914D\u7F6E").action(() => {
    console.log(chalk5.blue("\u2699\uFE0F  \u5F53\u524D\u914D\u7F6E"));
    console.log(chalk5.yellow("\u26A0\uFE0F  Phase 1 \u5B9E\u73B0"));
  });
  cmd.command("set <key> <value>").description("\u8BBE\u7F6E\u914D\u7F6E\u9879").action((key, value) => {
    console.log(chalk5.blue(`\u2699\uFE0F  \u8BBE\u7F6E ${key} = ${value}`));
    console.log(chalk5.yellow("\u26A0\uFE0F  Phase 2 \u5B9E\u73B0"));
  });
  cmd.command("reset").description("\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u914D\u7F6E").action(() => {
    console.log(chalk5.blue("\u2699\uFE0F  \u91CD\u7F6E\u914D\u7F6E"));
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
      st.dependencies = manifest.subtasks.filter((s) => dbsKeywords.some((k) => s.description.toLowerCase().includes(k.toLowerCase()))).map((s) => s.id);
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
\u6E05\u5355\u5DF2\u4FDD\u5B58: .spec-align/${id}/tasks.json`));
      console.log(chalk6.gray(`\u5B50\u4EFB\u52A1\u4E0A\u4E0B\u6587\u63D0\u53D6: npx spec-thought-align start --id ${id} --sub <subId>`));
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
      console.log(chalk8.yellow(`\u5F85\u68C0\u67E5: ${unchecked.length + (pending.length > 0 ? pending.length : 0) * 2} \u6761`));
      if (failed.length > 0) console.log(chalk8.red(`\u5931\u8D25: ${failed.length} \u9879`));
      console.log(`
${chalk8.bold("\u5B50\u4EFB\u52A1\u72B6\u6001:")}`);
      for (const st of toCheck) {
        const icon = st.status === "done" ? "\u2705" : st.status === "failed" ? "\u274C" : st.status === "in-progress" ? "\u{1F504}" : "\u23F3";
        const depStr = st.dependencies.length > 0 ? chalk8.gray(` (\u4F9D\u8D56: ${st.dependencies.join(", ")})`) : "";
        console.log(`  ${icon} ${chalk8.cyan(st.id)} ${st.status.padEnd(12)} ${st.description}${depStr}`);
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

// packages/cli/src/index.ts
var program = new Command10();
program.name("spec-thought-align").description("AI Coding Agent \u65BD\u5DE5\u524D\u7684\u9700\u6C42\u89C4\u7EA6\u53EF\u89C6\u5316\u786E\u8BA4\u9762\u677F").version("0.1.0");
program.addCommand(createSubmitCommand());
program.addCommand(createFetchCommand());
program.addCommand(createStatusCommand());
program.addCommand(createListCommand());
program.addCommand(createCompleteCommand());
program.addCommand(createSplitCommand());
program.addCommand(createStartCommand());
program.addCommand(createVerifyCommand());
program.addCommand(createConfigCommand());
program.parse(process.argv);
