import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Spec } from '@spec-thought-align/shared';

function isMermaidSyntax(code: string): boolean {
  if (!code || code.trim().length === 0) return false;
  const firstLine = code.trim().split('\n')[0].trim();
  const keywords = [
    'graph ',
    'flowchart ',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'erDiagram',
    'gantt',
    'pie',
    'gitGraph',
    'mindmap',
    'timeline',
    'quadrantChart',
    'sankey-beta',
    'block-beta',
  ];
  return keywords.some((kw) => firstLine.startsWith(kw));
}

interface Props {
  architecture: Spec['plan']['architecture'];
}

export function ArchitectureDiagram({ architecture }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!architecture || !isMermaidSyntax(architecture)) return;

    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        const result = await mermaid.render(id, architecture);

        if (!cancelled) {
          el.innerHTML = result.svg;
          setRenderError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setRenderError(e.message || String(e));
          el.innerHTML = '';
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [architecture]);

  if (!architecture || !isMermaidSyntax(architecture)) return null;

  return (
    <div className="border border-slate-700/60 rounded-md overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span>{t('architectureDiagram')}</span>
        <span className="text-slate-600">{collapsed ? '▶' : '▼'}</span>
      </button>
      {!collapsed && (
        <div className="px-3 pb-3">
          {renderError ? (
            <div className="text-xs text-destructive p-2 bg-destructive/5 rounded border border-destructive/20">
              {renderError}
            </div>
          ) : (
            <div
              ref={containerRef}
              className="mermaid-container overflow-x-auto flex justify-center"
            />
          )}
        </div>
      )}
    </div>
  );
}
