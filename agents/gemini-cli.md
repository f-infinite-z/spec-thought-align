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

## 触发条件

**跳过（直接施工）：**

- 单文件小改动（修 bug、改配置、加注释、格式化、重命名）
- 需求非常明确，无歧义，无假设
- 不涉及架构决策或多模块联动

**触发（使用 Spec-Align）：**

- 新功能开发、多文件重构
- 需求存在模糊之处，有假设或不确定
- 涉及架构变更、技术选型
- 影响范围不清晰

触发时告知用户，然后执行下面的流程。

---

## 工作流程

> Gemini CLI 有 exec 超时。使用 --no-wait + await-confirm 模式确保数据不丢失。

### 步骤 1：提交规约

```bash
spec-thought-align submit \
  --id "<任务名>" \
  --request "<用户原始需求>" \
  --analysis "<你的完整分析>" \
  --no-wait
```

创建 `.spec-thought-align/<任务名>/spec.json`，启动可视化面板 Server（端口 5678）。告知用户面板 URL。

### 步骤 2：等待用户确认

```bash
spec-thought-align await-confirm --id "<任务名>" --timeout 600
```

HTTP API 轮询优先，Server 不可达时自动切换文件系统轮询。确认后输出完整 JSON 规约。超时默认 600s。

> 进程中断后可重新执行此命令取结果。数据始终在 `.spec-thought-align/<任务名>/spec.json` 持久化。

### 步骤 3：施工

严格按 `await-confirm` 输出的 JSON 规约执行：

- `scope.inScope` / `scope.outOfScope` — 范围
- `questions[].userAnswer` — 用户逐条澄清
- `plan.components` / `plan.techStack` — 架构和技术栈

### 步骤 4：标记完成

```bash
spec-thought-align complete --id "<任务名>" --summary "<摘要>"
```

---

## 文件兜底

```bash
cat .spec-thought-align/<任务名>/result.json   # 优先
cat .spec-thought-align/<任务名>/spec.json     # 兜底
```
