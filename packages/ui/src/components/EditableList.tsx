import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function EditableList({
  label,
  items,
  color,
  onChange,
  readOnly = false,
}: {
  label: string;
  items: string[];
  color: 'green' | 'red' | 'yellow' | 'blue';
  onChange: (items: string[]) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const colorClasses: Record<string, string> = {
    green: 'text-green-600 border-green-500/20 bg-green-500/5',
    red: 'text-red-600 border-red-500/20 bg-red-500/5',
    yellow: 'text-yellow-600 border-yellow-500/20 bg-yellow-500/5',
    blue: 'text-blue-600 border-blue-500/20 bg-blue-500/5',
  };

  const add = () => {
    if (!newItem.trim()) return;
    onChange([...items, newItem.trim()]);
    setNewItem('');
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      setEditingIdx(null);
    }
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(items[idx]);
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    const value = editValue.trim();
    if (value) {
      const updated = [...items];
      updated[editingIdx] = value;
      onChange(updated);
    }
    setEditingIdx(null);
  };

  return (
    <div className="mb-2">
      <span className="label-sm">{label}</span>
      {items.length === 0 && <p className="text-xs text-slate-400 italic mt-1">{t('none')}</p>}
      <ul className="mt-1 space-y-1">
        {items.map((item, i) => (
          <li
            key={`${item}-${i}`}
            className={cn(
              'text-xs px-2 py-1 rounded border flex justify-between items-center',
              colorClasses[color],
            )}
          >
            {editingIdx === i && !readOnly ? (
              <input
                autoFocus
                className="flex-1 bg-transparent border-none outline-none px-1 py-0 text-xs"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditingIdx(null);
                }}
                onBlur={commitEdit}
              />
            ) : (
              <span
                className={cn('flex-1 cursor-text', readOnly && 'cursor-default')}
                onClick={() => {
                  if (!readOnly) startEdit(i);
                }}
                title={readOnly ? undefined : '点击编辑'}
              >
                {item}
              </span>
            )}
            {!readOnly && (
              <button
                onClick={() => remove(i)}
                className="text-slate-400 hover:text-red-500 ml-2 text-xs transition-colors shrink-0"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <div className="flex gap-1 mt-1">
          <input
            className="input-field text-xs py-1 flex-1"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
            }}
            placeholder={t('addItem')}
          />
          <Button size="xs" variant="secondary" onClick={add}>
            +
          </Button>
        </div>
      )}
    </div>
  );
}
