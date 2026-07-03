import { useTranslation } from 'react-i18next';
import type { Question } from '@spec-thought-align/shared';
import { cn } from '@/lib/utils';
import { EditableText } from './EditableText';

export function QuestionsList({
  questions,
  onChange,
  readOnly = false,
}: {
  questions: Question[];
  onChange: (q: Question[]) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();

  if (questions.length === 0) {
    return <p className="text-xs text-slate-400 italic">{t('noQuestions')}</p>;
  }

  return (
    <ul className="space-y-3">
      {questions.map((q, i) => {
        const importanceIcon =
          q.importance === 'critical' ? '🔴' : q.importance === 'important' ? '🟡' : '🟢';

        return (
          <li key={q.id} className="text-sm">
            <div className="flex items-start gap-2 mb-1">
              <span>{importanceIcon}</span>
              <span className="text-slate-800">{q.question}</span>
            </div>

            {q.options && q.options.length > 0 ? (
              <div className="ml-6 flex flex-wrap gap-1">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    className={cn(
                      'text-xs px-2 py-1 rounded border transition-colors',
                      readOnly ? 'cursor-default' : '',
                      q.userAnswer === opt
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-slate-300 text-slate-600 hover:border-primary/50',
                    )}
                    onClick={() => {
                      if (readOnly) return;
                      const updated = [...questions];
                      updated[i] = { ...q, userAnswer: q.userAnswer === opt ? undefined : opt };
                      onChange(updated);
                    }}
                    disabled={readOnly}
                  >
                    {opt}
                    {q.userAnswer === opt && <span className="ml-1">✓</span>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="ml-6">
                {q.userAnswer ? (
                  <EditableText
                    value={q.userAnswer}
                    placeholder={t('typeAnswer')}
                    onChange={(v) => {
                      const updated = [...questions];
                      updated[i] = { ...q, userAnswer: v };
                      onChange(updated);
                    }}
                    readOnly={readOnly}
                  />
                ) : readOnly ? (
                  <span className="text-xs text-slate-400 italic">{t('unanswered')}</span>
                ) : (
                  <input
                    className="input-field text-xs py-1"
                    placeholder={t('typeYourAnswer')}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        const updated = [...questions];
                        updated[i] = { ...q, userAnswer: e.target.value.trim() };
                        onChange(updated);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                        const updated = [...questions];
                        updated[i] = {
                          ...q,
                          userAnswer: (e.target as HTMLInputElement).value.trim(),
                        };
                        onChange(updated);
                      }
                    }}
                  />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
