# Spec-Align 集成

## CLI 路径

```bash
# 全局安装后
spec-thought-align

# 或从本地路径
node packages/cli/dist/index.js
```

> 若命令不可用（未安装/未构建），跳过此流程，直接施工。

---

## 触发条件（半硬约束）

在分析用户需求后，**必须先调用 detect 命令**进行程序化判断：

```bash
spec-thought-align detect \
  --platform claude-code \
  --files <预估修改文件数> \
  --request "<用户原始需求>" \
  [--new-feature] [--bug-fix] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
```

detect 返回 JSON，根据 `mode` 决定：

- `mode: "require"` — **必须**走 spec-align 流程
- `mode: "suggest"` — **应该**告知用户并询问是否使用
- `mode: "skip"` — **可以**跳过，直接施工

---

## 工作流程

> Claude Code 的 exec 默认超时约 120s，确认时间不可控。使用 **--no-wait + --check 轮询** 模式。

### 步骤 1：提交规约

```bash
spec-thought-align submit \
  --id "<任务名>" \
  --request "<用户原始需求>" \
  --analysis "<你的完整分析>" \
  --no-wait
```

此时会：

- 在 `.spec-thought-align/<任务名>/` 下创建 spec.json、status.json
- 启动可视化面板 Server（端口 5678）
- 输出面板 URL，告知用户在浏览器中确认

### 步骤 2：等待用户确认

使用 **--check** 模式轮询（每次调用立即返回，不会被 exec 超时杀死）：

```bash
spec-thought-align await-confirm --id "<任务名>" --timeout 600 --check
```

- 如果用户已确认 → 立即输出 JSON 并退出 (exit 0)
- 如果未确认 → 输出提示并退出 (exit 1)，每隔 10-15s 重试一次
- 数据始终在 `.spec-thought-align/<任务名>/` 中持久化

### 步骤 3：根据规约施工

`await-confirm` 输出的 JSON 是最终规约，**严格按它施工**。

### 步骤 4：标记完成

```bash
spec-thought-align complete --id "<任务名>" --summary "<做了什么>"
```
