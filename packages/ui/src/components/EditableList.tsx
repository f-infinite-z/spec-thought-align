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
            <span>{item}</span>
            {!readOnly && (
              <button
                onClick={() => remove(i)}
                className="text-slate-400 hover:text-red-500 ml-2 text-xs transition-colors"
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
          <Button size="xs" variant="outline" onClick={add}>
            +
          </Button>
        </div>
      )}
    </div>
  );
}
