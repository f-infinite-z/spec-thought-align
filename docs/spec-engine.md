# Spec-Align 规约引擎设计

## 从 Agent 原始文本到结构化规约的转换策略

### Level 1：纯规则匹配（V1 默认）

输入：Agent 的自然语言思考文本
输出：半结构化的预填充数据

#### 规则集

| 规则     | 关键词/模式                      | 目标字段                       | 置信度         |
| -------- | -------------------------------- | ------------------------------ | -------------- |
| 提取目标 | "核心/目标/要做/实现" + 后续句子 | `understanding.goal`           | high           |
| 提取假设 | "假设/应该/可能/大概/估计"       | `scope.assumptions[]`          | 根据语气词判断 |
| 生成问题 | "不确定/不清楚/没提到/没说/问你" | `questions[]`                  | critical       |
| 技术栈   | "用XX/基于XX/React/Vue/Node/..." | `plan.techStack[]`             | high           |
| 组件     | "包含/需要/分为" + 名词列表      | `plan.components[]`            | medium         |
| 范围提取 | "不需要/不包括/不用/不考虑"      | `scope.outOfScope[]`           | high           |
| 约束     | "必须/不能/限制/要求"            | `scope.constraints[]`          | high           |
| 输入输出 | "输入/输出/返回/接收/参数"       | `io.inputs[]` / `io.outputs[]` | medium         |

#### 置信度判断算法

```
句子中包含:
  "一定/必须/肯定/显然是"  → confidence = "high"
  "可能/大概/通常/一般"     → confidence = "medium"
  "不确定/不清楚/也许/猜"   → confidence = "low"
  "假设" + 任何内容         → needsConfirmation = true
```

#### 规则引擎伪代码

```typescript
function parseAnalysis(text: string): Partial<Spec> {
  const spec: Partial<Spec> = {
    understanding: { goal: '', context: '', rawRequest: '' },
    scope: { inScope: [], outOfScope: [], constraints: [], assumptions: [] },
    plan: { architecture: '', components: [], techStack: [] },
    io: { inputs: [], outputs: [], acceptanceCriteria: [] },
    questions: [],
  };

  // 按段落/行分割
  const lines = text.split('\n');
  const numberedItems = extractNumberedItems(lines);

  for (const item of numberedItems) {
    // 规则1: 目标提取
    if (isGoalSentence(item)) {
      spec.understanding!.goal = item.text;
      spec.scope!.inScope!.push(item.text);
    }

    // 规则2: 假设提取（最关键）
    if (isAssumption(item)) {
      spec.scope!.assumptions!.push({
        id: generateId(),
        text: item.text,
        confidence: detectConfidence(item.text),
        needsConfirmation: item.hasUncertainty,
      });
    }

    // 规则3: 问题生成
    if (item.hasUncertainty) {
      spec.questions!.push({
        id: generateId(),
        question: generateQuestion(item.text),
        importance: item.isCritical ? 'critical' : 'important',
      });
    }

    // ... 其他规则
  }

  return spec;
}
```

### Level 2：LLM 自动提取（V1.1）

当用户配置了 LLM API Key 时启用。

```typescript
async function parseAnalysisWithLLM(request: string, analysis: string): Promise<Partial<Spec>> {
  const prompt = `
你是一个需求规约提取器。根据以下信息，提取结构化规约。

## 用户原始需求
${request}

## Agent 分析
${analysis}

## 任务
提取为 JSON，严格遵循以下 Schema。对于 Agent 不确定的地方，
confidence 设为 "low"，并生成对应的 question。

## 关键要求
- 从 Agent 分析中识别所有假设，标注置信度
- 识别 Agent 明确说"不确定"的部分，生成问题
- 区分 in-scope 和 out-of-scope
- 提取技术栈和组件信息
- 如果某字段没有足够信息，留空
`;

  const response = await llm.complete({
    model: config.llm.model || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
    temperature: 0.1,
  });

  return JSON.parse(response.content);
}
```

## 纯规则 vs LLM 的取舍

| 维度     | 纯规则                             | LLM                  |
| -------- | ---------------------------------- | -------------------- |
| 成本     | 0                                  | ~$0.0003/次          |
| 准确度   | 60-70%                             | 90%+                 |
| 召回率   | Agent 结构化输出时高，自由文本时低 | 对各种文本风格都高   |
| 隐私     | 完全本地                           | 数据发送到 API       |
| 离线可用 | ✅                                 | ❌（除非用本地模型） |
| 维护成本 | 需要持续添加规则                   | Prompt 调优即可      |

V1 以纯规则为主，LLM 作为可选增强。两者可以叠加：规则做初筛，LLM 做补全。
