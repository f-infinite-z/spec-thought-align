import type { Spec } from '@spec-thought-align/shared';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Props {
  components: Spec['plan']['components'];
}

export function ComponentsTree({ components }: Props) {
  const { t } = useTranslation();

  if (!components || components.length === 0) return null;

  return (
    <div className="space-y-2">
      {components.map((comp, i) => (
        <div key={i} className="border border-slate-700/60 rounded-md p-3 bg-slate-900/40">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center text-xs font-bold',
                  i === 0 ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-300',
                )}
              >
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-slate-200">{comp.name}</span>
            </div>
            {comp.files && comp.files.length > 0 && (
              <span className="text-xs text-slate-500 tabular-nums">
                {comp.files.length} {comp.files.length === 1 ? 'file' : 'files'}
              </span>
            )}
          </div>

          {comp.description && (
            <p className="text-xs text-slate-400 ml-7 mb-2">{comp.description}</p>
          )}

          {(comp.dependencies?.length || 0) > 0 && (
            <div className="flex items-start gap-2 ml-7 mb-1.5">
              <span className="text-xs text-slate-500 shrink-0 mt-0.5">{t('dependsOn')}:</span>
              <div className="flex gap-1 flex-wrap">
                {comp.dependencies!.map((dep, j) => (
                  <span
                    key={j}
                    className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {comp.files && comp.files.length > 0 && (
            <div className="flex items-start gap-2 ml-7">
              <span className="text-xs text-slate-500 shrink-0 mt-0.5">{t('files')}:</span>
              <div className="flex gap-1 flex-wrap">
                {comp.files.map((file, j) => (
                  <code
                    key={j}
                    className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-blue-900/30 font-mono"
                  >
                    {file}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
