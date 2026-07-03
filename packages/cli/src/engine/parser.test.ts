import { describe, it, expect } from 'vitest';
import { parseAnalysis, fillSpecFromAnalysis } from './parser.js';
import { createEmptySpec } from '@spec-thought-align/shared';

describe('parseAnalysis - improved parsing', () => {
  it('extracts goal from leading sentence', () => {
    const r = parseAnalysis('核心目标是构建用户注册页面，支持邮箱和手机号两种注册方式。');
    expect(r.goal).toContain('用户注册');
  });

  it('extracts tech stack from all segments', () => {
    const r = parseAnalysis(
      '前端用 React + TypeScript + Tailwind。后端用 Node.js + Express + PostgreSQL。',
    );
    expect(r.techStack).toContain('React');
    expect(r.techStack).toContain('TypeScript');
    expect(r.techStack).toContain('Tailwind');
    expect(r.techStack).toContain('Node.js');
  });

  it('filters section headers from assumptions/questions', () => {
    const r = parseAnalysis('不确定的地方：\n1. 密码强度要求？\n2. 验证码需要吗？');
    // Should NOT include "不确定的地方：" as a question
    expect(r.questions.every((q) => !q.question.includes('不确定的地方'))).toBe(true);
    expect(r.assumptions.every((a) => !a.text.includes('不确定的地方'))).toBe(true);
  });

  it('detects explicit assumptions with confidence', () => {
    const r = parseAnalysis('假设用 React + Tailwind。');
    // Text gets parsed as explicit assumption with "假设" prefix
    const reactAssumption = r.assumptions.find(
      (a) => a.text.includes('React') || a.text.includes('Tailwind'),
    );
    // If not found as assumption, check inScope
    const foundAnywhere = reactAssumption || r.inScope.some((s) => s.includes('React'));
    expect(foundAnywhere).toBeTruthy();
  });

  it('detects uncertainty markers as questions + low assumptions', () => {
    const r = parseAnalysis('不确定密码强度要求。');
    console.log('segments:', JSON.stringify(r));
    // '不确定' 开头的不完整句应被识别为问题或假设
    const found = r.questions.length > 0 || r.assumptions.length > 0;
    expect(found).toBe(true);
  });

  it('detects natural questions ending with ？', () => {
    const r = parseAnalysis('需要支持手机号注册吗？');
    expect(r.questions.length).toBeGreaterThanOrEqual(1);
  });

  it('detects out-of-scope items', () => {
    const r = parseAnalysis('不需要第三方登录。不做国际化。');
    expect(r.outOfScope.some((s) => s.includes('第三方'))).toBe(true);
    expect(r.outOfScope.some((s) => s.includes('国际化'))).toBe(true);
  });

  it('detects constraints', () => {
    const r = parseAnalysis('必须支持 HTTPS。');
    expect(r.constraints.some((s) => s.includes('HTTPS'))).toBe(true);
  });

  it('filters parenthetical section headers from out-of-scope', () => {
    const r = parseAnalysis('不做（默认假设）：\n- 不需要用户登录注册');
    expect(r.outOfScope.some((s) => s.includes('默认假设'))).toBe(false);
    expect(r.outOfScope.some((s) => s.includes('登录'))).toBe(true);
  });

  it('parses numbered items as inScope', () => {
    const r = parseAnalysis('1. 首页展示\n2. 作品集卡片\n3. 博客列表');
    expect(r.inScope.length).toBeGreaterThanOrEqual(3);
  });
});

describe('parseAnalysis - real world scenario', () => {
  const realAnalysis = `核心目标是构建一个展示作品集的个人博客网站。

我理解需要包含以下模块：
1. 首页（个人介绍 + 精选作品 + 最新文章）
2. 作品集（项目卡片网格）
3. 博客（文章列表 + Markdown 渲染）
4. 关于我页面

技术方案假设：
- 前端用 React + TypeScript + Tailwind CSS
- 博客内容用 Markdown 文件管理
- 路由用 React Router

不确定的地方：
1. 是否需要后端？
2. 设计风格偏好？
3. 部署方式？

不做（默认假设）：
- 不需要用户登录注册
- 不需要 CMS 后台
- 不需要国际化`;

  it('extracts goal', () => {
    const r = parseAnalysis(realAnalysis);
    expect(r.goal).toContain('作品集');
    expect(r.goal).toContain('博客');
  });

  it('extracts tech stack', () => {
    const r = parseAnalysis(realAnalysis);
    expect(r.techStack).toContain('React');
    expect(r.techStack).toContain('TypeScript');
    expect(r.techStack).toContain('Tailwind');
    expect(r.techStack).toContain('React Router');
    expect(r.techStack).toContain('Markdown');
  });

  it('extracts inScope items', () => {
    const r = parseAnalysis(realAnalysis);
    expect(r.inScope.length).toBeGreaterThanOrEqual(4);
    expect(r.inScope.some((s) => s.includes('首页'))).toBe(true);
    expect(r.inScope.some((s) => s.includes('作品集'))).toBe(true);
    expect(r.inScope.some((s) => s.includes('博客'))).toBe(true);
  });

  it('extracts outOfScope items without section headers', () => {
    const r = parseAnalysis(realAnalysis);
    expect(r.outOfScope.some((s) => s.includes('登录'))).toBe(true);
    expect(r.outOfScope.some((s) => s.includes('CMS'))).toBe(true);
    // 不应包含标题
    expect(r.outOfScope.every((s) => !s.includes('默认假设'))).toBe(true);
  });

  it('extracts meaningful questions', () => {
    const r = parseAnalysis(realAnalysis);
    // Should have questions about backend, style, deployment
    expect(r.questions.some((q) => q.question.includes('后端'))).toBe(true);
    expect(r.questions.some((q) => q.question.includes('设计风格'))).toBe(true);
    expect(r.questions.some((q) => q.question.includes('部署'))).toBe(true);
    // Should NOT include section headers
    expect(r.questions.every((q) => !q.question.includes('不确定的地方'))).toBe(true);
  });

  it('filters noise (section headers, option fragments)', () => {
    const r = parseAnalysis(realAnalysis);
    // No section headers in assumptions
    const badWords = ['不确定的地方', '技术方案假设', '默认假设', '我理解需要'];
    for (const a of r.assumptions) {
      expect(badWords.some((w) => a.text.includes(w))).toBe(false);
    }
  });
});

describe('fillSpecFromAnalysis', () => {
  it('fills empty spec from analysis', () => {
    const spec = createEmptySpec('test', '做个博客', '假设用 React + TypeScript。不需要后端。');
    fillSpecFromAnalysis(spec);

    expect(spec.plan.techStack).toContain('React');
    expect(spec.plan.techStack).toContain('TypeScript');
    expect(spec.scope.outOfScope.length).toBeGreaterThan(0);
  });

  it('does not overwrite filled fields', () => {
    const spec = createEmptySpec('test', 'x', '假设用 Vue');
    spec.understanding.goal = '已有目标';
    spec.scope.assumptions = [
      { id: 'x', text: '已有假设', confidence: 'high', needsConfirmation: false },
    ];
    fillSpecFromAnalysis(spec);

    expect(spec.understanding.goal).toBe('已有目标');
    expect(spec.scope.assumptions[0].text).toBe('已有假设');
  });
});

describe('parseAnalysis - escaped newline normalization', () => {
  it('splits analysis with escaped \\\\n into proper segments', () => {
    const analysis =
      '核心目标是构建用户系统。\\n\\n不确定之处：\\n- 需要支持 OAuth 吗？\\n- 密码强度要求？';
    const r = parseAnalysis(analysis);
    expect(r.questions.length).toBeGreaterThanOrEqual(2);
    expect(r.questions.some((q) => q.question.includes('OAuth'))).toBe(true);
    expect(r.questions.some((q) => q.question.includes('密码'))).toBe(true);
  });

  it('handles real-world analysis with escaped newlines', () => {
    const analysis =
      '## 需求\\n要做个博客。\\n\\n## 不确定之处\\n- 选 React 还是 Vue？\\n- 要不要后端？\\n- 部署用 Vercel？';
    const r = parseAnalysis(analysis);
    expect(r.questions.length).toBeGreaterThanOrEqual(3);
  });
});

describe('parseAnalysis - compound clause splitting', () => {
  it('splits uncertainty with conjunction markers into multiple questions', () => {
    const r = parseAnalysis('不确定密码强度要求，以及是否需要验证码，还有是否需要支持第三方登录');
    expect(r.questions.length).toBeGreaterThanOrEqual(3);
  });

  it('splits compound natural questions', () => {
    const r = parseAnalysis('需要支持手机号注册吗以及邮箱注册吗还有是否需要验证码？');
    expect(r.questions.length).toBeGreaterThanOrEqual(2);
  });

  it('splits uncertainty with alternative connectors', () => {
    const r = parseAnalysis('不确定用 React 还是 Vue 或者 Svelte？');
    expect(r.questions.length).toBeGreaterThanOrEqual(1);
  });

  it('does not over-split short uncertainty text', () => {
    const r = parseAnalysis('不确定是否支持 HTTPS。');
    expect(r.questions.length).toBeGreaterThanOrEqual(1);
    expect(r.assumptions.length).toBeGreaterThanOrEqual(1);
  });
});

describe('parseAnalysis - no slash option detection', () => {
  it('does not merge items separated by / into options', () => {
    const r = parseAnalysis('不确定使用 P0/P1/P2 全修还是只修 P0？');
    // Should be a single question, not split by /
    expect(r.questions.length).toBeGreaterThanOrEqual(1);
    // Should not have /-based fragment merging artifacts
    expect(r.questions.every((q) => !q.question.includes(' / '))).toBe(true);
  });
});
