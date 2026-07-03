import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openFloatWindow } from '@/utils';

export function Header({
  taskId,
  status,
  saving,
  isFloat,
  confirmed,
}: {
  taskId: string;
  status: string;
  saving: boolean;
  isFloat: boolean;
  confirmed: boolean;
}) {
  const { t, i18n } = useTranslation();

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const toggleLang = () => {
    const next = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
    i18n.changeLanguage(next);
    localStorage.setItem('spec-thought-align-lang', next);
  };

  return (
    <header className="header">
      <div className="flex items-center gap-3 flex-1">
        <h1 className="text-base font-bold text-slate-200">Spec-Align</h1>
        <span className="text-slate-500 font-mono text-xs">{taskId}</span>
        <span
          className={cn(
            'px-2 py-0.5 text-xs rounded-full border',
            statusColors[status] || statusColors.pending,
          )}
        >
          {statusLabels[status] || status}
        </span>
        {saving && <span className="text-xs text-slate-400 animate-pulse">{t('saving')}</span>}
      </div>
      <div className="flex items-center gap-2">
        {confirmed && taskId && (
          <span className="text-xs text-slate-500 italic">
            {status === 'confirmed' ? t('cliReturned') : t('cancelled')}
          </span>
        )}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
          title={i18n.language === 'zh-CN' ? 'Switch to English' : '切换到中文'}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{i18n.language === 'zh-CN' ? '中文' : 'EN'}</span>
        </button>
        {!isFloat && (
          <Button
            variant="ghost"
            size="xs"
            className="text-slate-400 hover:text-slate-200"
            onClick={() => openFloatWindow(taskId)}
            title={t('switchFloat')}
          >
            {t('float')}
          </Button>
        )}
      </div>
    </header>
  );
}
