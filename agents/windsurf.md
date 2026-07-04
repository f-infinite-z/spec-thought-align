# Spec-Align 需求确认

安装：`npm i -g spec-thought-align` 或使用本地路径 `node packages/cli/dist/index.js`。

若 CLI 不可用，跳过此流程直接施工。

## 何时触发

**跳过：** 单文件修 bug、改配置、加注释、格式化、重命名，或需求无歧义。

**触发：** 新功能、多文件重构、需求模糊、架构变更、影响范围不清晰。

触发时告知用户后将需求写入分析，执行下面的流程。

## 流程

Windsurf 可执行终端命令。使用 --no-wait + await-confirm 确保可靠性。

### 1. 提交

```bash
spec-thought-align submit \
  --id "<任务名>" \
  --request "<用户原始需求>" \
  --analysis "<你的完整分析>" \
  --no-wait
```

创建 `.spec-thought-align/<任务名>/spec.json`，启动可视化面板。将面板 URL 告知用户。

### 2. 等待确认

```bash
spec-thought-align await-confirm --id "<任务名>" --timeout 600
```

HTTP API 轮询优先，Server 不可达时自动切文件系统轮询。确认后输出 JSON 规约。

若进程中断，在后续对话中重新执行此命令。数据持久化于 `.spec-thought-align/<任务名>/spec.json`。

### 3. 施工

严格按 JSON 规约执行：

- `scope.inScope/outOfScope` — 范围
- `questions[].userAnswer` — 用户澄清
- `plan.components/techStack` — 架构和栈

### 4. 完成

```bash
spec-thought-align complete --id "<任务名>" --summary "<摘要>"
```

## 文件兜底

Server 关闭后可直接读文件：

```bash
cat .spec-thought-align/<任务名>/result.json   # 优先
cat .spec-thought-align/<任务名>/spec.json     # 兜底
```
