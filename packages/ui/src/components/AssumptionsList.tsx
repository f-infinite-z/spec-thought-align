import { useTranslation } from 'react-i18next';
import type { Assumption } from '@spec-thought-align/shared';
import { cn } from '@/lib/utils';
import { EditableText } from './EditableText';

export function AssumptionsList({
  assumptions,
  onChange,
  readOnly = false,
}: {
  assumptions: Assumption[];
  onChange: (a: Assumption[]) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();

  const confidenceConfig: Record<
    string,
    { icon: string; border: string; bg: string; label: string }
  > = {
    high: {
      icon: '🟢',
      border: 'border-green-500/30',
      bg: 'bg-green-500/10',
      label: t('highConfidence'),
    },
    medium: {
      icon: '🟡',
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/10',
      label: t('mediumConfidence'),
    },
    low: {
      icon: '🔴',
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      label: t('needsConfirmation'),
    },
  };

  if (assumptions.length === 0) {
    return <p className="text-xs text-slate-400 italic">{t('noAssumptions')}</p>;
  }

  return (
    <ul className="space-y-2">
      {assumptions.map((a, i) => {
        const cfg = confidenceConfig[a.confidence] || confidenceConfig.medium;
        return (
          <li key={a.id} className={cn('text-sm px-3 py-2 rounded border', cfg.border, cfg.bg)}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5">{cfg.icon}</span>
              <div className="flex-1">
                <EditableText
                  value={a.text}
                  placeholder={t('assumptionContent')}
                  onChange={(v) => {
                    const updated = [...assumptions];
                    updated[i] = { ...a, text: v };
                    onChange(updated);
                  }}
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{cfg.label}</span>
                    {a.userConfirmed ? (
                      <span className="text-xs text-green-600">✓ {t('confirmed2')}</span>
                    ) : a.needsConfirmation ? (
                      <button
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                        onClick={() => {
                          const updated = [...assumptions];
                          updated[i] = { ...a, userConfirmed: true };
                          onChange(updated);
                        }}
                      >
                        {t('clickToConfirm')}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
