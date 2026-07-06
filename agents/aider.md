# Spec-Align 集成

## CLI 路径

```bash
# 全局安装后
spec-thought-align

# 或从本地路径
node packages/cli/dist/index.js
```

若命令不可用，跳过此流程，直接施工。

---

## 触发条件（半硬约束）

在分析用户需求后，**必须先调用 detect 命令**进行程序化判断：

```bash
spec-thought-align detect \
  --platform aider \
  --files <预估修改文件数> \
  --request "<用户原始需求>" \
  [--new-feature] \
  [--architecture-change] \
  [--has-ambiguity] \
  [--complexity low|medium|high]
```

detect 返回 JSON，根据 `mode` 决定：

- `mode: "require"` — **必须**走 spec-align 流程
- `mode: "suggest"` — **应该**告知用户并询问是否使用
- `mode: "skip"` — **可以**跳过，直接施工

---

## 工作流程

> Aider 没有严格的 exec 超时限制，可以直接使用 --wait 模式，体验更简洁。

### 步骤 1：提交并等待确认

```bash
spec-thought-align submit \
  --id "<任务名>" \
  --request "<用户原始需求>" \
  --analysis "<你的完整分析>" \
  --wait
```

此命令会阻塞等待用户确认，确认后直接输出完整 JSON 规约并退出。

若担心等待时间过长，也可以用 --no-wait + await-confirm 模式（与 Claude Code 适配文档中的流程一致）。

### 步骤 2：施工

严格按 `submit --wait` 输出的 JSON 规约执行：

- `scope.inScope` / `scope.outOfScope` — 范围边界
- `questions[].userAnswer` — 用户逐条澄清
- `plan.components` / `plan.techStack` — 架构和技术栈
- 不可对用户已回答的问题自行假设

### 步骤 3：标记完成

```bash
spec-thought-align complete --id "<任务名>" --summary "<做了什么>"
```

---

## 备用模式

若担心 Aider session 中断导致 --wait 阻塞遗失结果：

```bash
# 步骤 1：提交但不等待
spec-thought-align submit --id "<任务名>" --request "..." --analysis "..." --no-wait

# 步骤 2：稍后重连获取结果
spec-thought-align await-confirm --id "<任务名>"
```

## 文件兜底

```bash
cat .spec-thought-align/<任务名>/result.json   # 优先
cat .spec-thought-align/<任务名>/spec.json     # 兜底
```
