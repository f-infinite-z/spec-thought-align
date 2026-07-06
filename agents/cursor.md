# Spec-Align 需求确认

安装：`npm i -g spec-thought-align` 或使用本地路径 `node packages/cli/dist/index.js`。

若 CLI 不可用，跳过此流程直接施工。

## 触发条件（半硬约束）

在分析用户需求后，**必须先调用 detect 命令**进行程序化判断：

```bash
spec-thought-align detect \
  --platform cursor \
  --files <预估修改文件数> \
  --request "<用户原始需求>" \
  [--new-feature] \
  [--architecture-change] \
  [--has-ambiguity] \
  [--complexity low|medium|high]
```

detect 返回 JSON，根据 `mode` 决定：

- `mode: "require"` — **必须**走 spec-align 流程
- `mode: "suggest"` — **应该**告知用户并询问
- `mode: "skip"` — **可以**跳过

## 流程

Cursor 可执行终端命令，但确认时间不可控。使用 --no-wait + await-confirm 模式。

### 1. 提交

```bash
spec-thought-align submit \
  --id "<任务名>" \
  --request "<用户原始需求>" \
  --analysis "<你的完整分析>" \
  --no-wait
```

这会创建 `.spec-thought-align/<任务名>/` 并启动可视化面板。将面板 URL 告知用户。

### 2. 等待确认

```bash
spec-thought-align await-confirm --id "<任务名>" --timeout 600
```

HTTP API 轮询 Server（优先），不可达时自动切文件系统轮询。确认后输出 JSON 规约。超时默认 600s。

若进程中断，在后续对话中重新执行此命令即可。数据始终在 `.spec-thought-align/<任务名>/spec.json` 中持久化。

### 3. 施工

严格按 `await-confirm` 输出的 JSON 规约执行：

- `scope.inScope/outOfScope` — 范围边界
- `questions[].userAnswer` — 用户逐条澄清
- `plan.components/techStack` — 架构和技术栈

### 4. 完成

```bash
spec-thought-align complete --id "<任务名>" --summary "<摘要>"
```

## 文件兜底

Server 关闭后可直接读文件取结果：

```bash
cat .spec-thought-align/<任务名>/result.json   # 优先
cat .spec-thought-align/<任务名>/spec.json     # 兜底
```
