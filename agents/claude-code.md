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

## 触发条件

在编写代码前，按以下规则判断是否需要走 Spec-Align 流程：

**跳过（直接施工）：**

- 单文件小改动（修 bug、改配置、加注释、格式化、重命名）
- 需求非常明确，无歧义，无假设
- 不涉及架构决策或多模块联动

**触发（使用 Spec-Align）：**

- 新功能开发、多文件重构
- 需求存在模糊之处，有假设或不确定
- 涉及架构变更、技术选型
- 影响范围不清晰

触发时，先告知用户："将使用 Spec-Align 确认需求"，然后执行下面的流程。

---

## 工作流程

> 注意：Claude Code 的 exec 默认超时约 120s，用户确认时间不可控。因此**强制使用 --no-wait + await-confirm 模式**。

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

```bash
spec-thought-align await-confirm --id "<任务名>" --timeout 600
```

- 通过 HTTP API 轮询 Server（优先），Server 不可达时自动切换文件系统轮询
- 确认后输出完整 JSON 规约到 stdout
- 超时（默认 600s）或用户取消时返回对应退出码

> 若步骤 2 因 Claude Code 超时而进程被杀，在**新对话/新 session** 中重新执行 `await-confirm` 即可。确认后的数据始终在 `.spec-thought-align/<任务名>/spec.json` 中持久化。

### 步骤 3：根据规约施工

`await-confirm` 输出的 JSON 是最终规约，**严格按它施工**：

- `scope.inScope` / `scope.outOfScope` 定义范围边界
- `questions[].userAnswer` 包含用户对疑问的逐条澄清
- `plan.components` 和 `plan.techStack` 指定架构和技术栈
- 不可对用户已回答的问题自行假设

### 步骤 4：标记完成

```bash
spec-thought-align complete \
  --id "<任务名>" \
  --summary "<做了什么>"
```

---

## 备用取结果方式

若 CLI 不可用或 Server 已关闭，可直接读取文件：

```bash
cat .spec-thought-align/<任务名>/result.json   # 有 result.json 优先
cat .spec-thought-align/<任务名>/spec.json     # 兜底
```
