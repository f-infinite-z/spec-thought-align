import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function EditableText({
  value,
  placeholder,
  onChange,
  multiline,
  className = '',
  readOnly = false,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft !== value) onChange(draft);
    setEditing(false);
  };

  if (readOnly) {
    return (
      <div className={cn('editable-display-readonly', className)}>
        {value || <span className="italic text-slate-400">{t('empty')}</span>}
      </div>
    );
  }

  if (editing) {
    return multiline ? (
      <div className={className}>
        <textarea
          className="input-field min-h-[80px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
          autoFocus
          placeholder={placeholder}
        />
      </div>
    ) : (
      <div className={className}>
        <input
          className="input-field"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
          autoFocus
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div
      className={cn('editable-display', className)}
      onClick={() => setEditing(true)}
      title={t('clickToEdit')}
    >
      {value || <span className="italic text-slate-400">{placeholder}</span>}
    </div>
  );
}
