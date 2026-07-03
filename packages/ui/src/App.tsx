import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Spec } from '@spec-thought-align/shared';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getTaskId, getFloatParam, api, setByPath } from '@/utils';
import { useHistory } from '@/hooks/useHistory';
import { Header } from '@/components/Header';
import { CenterMessage } from '@/components/CenterMessage';
import { SectionTitle } from '@/components/SectionTitle';
import { StatusBadge } from '@/components/StatusBadge';
import { EditableText } from '@/components/EditableText';
import { EditableList } from '@/components/EditableList';
import { AssumptionsList } from '@/components/AssumptionsList';
import { QuestionsList } from '@/components/QuestionsList';

export default function App() {
  const { t, i18n } = useTranslation();
  const taskId = getTaskId();
  const isFloat = getFloatParam();
  const [spec, setSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const pendingSpecRef = useRef<Spec | null>(null);
  const savedSpecRef = useRef<Spec | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { history, activeId, setActiveId } = useHistory(taskId);

  const displayTaskId = activeId || taskId;
  const isReadOnly = (confirmed || cancelled) && displayTaskId !== taskId;

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const loadSpec = useCallback(
    async (tid: string) => {
      if (!tid) return;
      setLoading(true);
      try {
        const res = await api(`/api/task/${tid}`);
        if (res.success) {
          setSpec(res.data);
          savedSpecRef.current = res.data;
        } else {
          setError(res.error || t('notFound'));
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    loadSpec(displayTaskId);
  }, [displayTaskId, loadSpec]);

  const switchTab = (tid: string) => {
    setActiveId(tid);
    loadSpec(tid);
  };

  const updateField = useCallback(
    async (path: string, value: unknown) => {
      if (!spec || isReadOnly) return;
      const newSpec = structuredClone(spec);
      setByPath(newSpec, path, value);
      setSpec(newSpec);
      pendingSpecRef.current = newSpec;

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(async () => {
        const toSave = pendingSpecRef.current;
        if (!toSave) return;
        setSaving(true);
        try {
          await api(`/api/task/${displayTaskId}/spec`, {
            method: 'POST',
            body: JSON.stringify(toSave),
          });
          savedSpecRef.current = toSave;
        } catch (e) {
          if (savedSpecRef.current) {
            setSpec(structuredClone(savedSpecRef.current));
          }
          toast.error(t('saveFailed'));
        } finally {
          setSaving(false);
        }
      }, 400);
    },
    [spec, displayTaskId, isReadOnly, t],
  );

  const handleConfirm = async () => {
    if (!displayTaskId) return;

    // 清除待处理的自动保存，防止与确认保存冲突
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    setSaving(true);
    try {
      await api(`/api/task/${displayTaskId}/spec`, {
        method: 'POST',
        body: JSON.stringify(spec),
      });
      await api(`/api/task/${displayTaskId}/confirm`, { method: 'POST' });
      setConfirmed(true);
      toast.success(t('confirmedBanner'));
    } catch (e: any) {
      toast.error(e.message || t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!displayTaskId) return;
    setShowCancelDialog(false);
    try {
      await api(`/api/task/${displayTaskId}/cancel`, { method: 'POST' });
      setCancelled(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!taskId) {
    return <CenterMessage>{t('missingTaskId')}</CenterMessage>;
  }

  if (loading) {
    return (
      <CenterMessage>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <p className="mt-3 text-slate-400">{t('loading')}</p>
      </CenterMessage>
    );
  }

  if (error && !spec) {
    return (
      <CenterMessage>
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('retry')}
        </Button>
      </CenterMessage>
    );
  }

  if (!spec) {
    return <CenterMessage>{t('notFound')}</CenterMessage>;
  }

  const status = cancelled ? 'cancelled' : confirmed ? 'confirmed' : spec.meta.status;
  const showHistoryTabs = history.length > 1;

  return (
    <div className="app">
      <Header
        taskId={displayTaskId}
        status={status}
        saving={saving}
        isFloat={isFloat}
        confirmed={confirmed || cancelled}
      />

      {showHistoryTabs && (
        <div className="history-tabs">
          {history.map((tid) => {
            const label =
              tid === taskId ? t('current') : tid === history[1] ? t('previous') : t('older');
            return (
              <button
                key={tid}
                className={cn('history-tab', activeId === tid && 'history-tab-active')}
                onClick={() => switchTab(tid)}
              >
                {label}
                <span className="history-tab-id">{tid}</span>
              </button>
            );
          })}
        </div>
      )}

      {(confirmed || cancelled) && (
        <div
          className={cn(
            'confirm-banner',
            confirmed ? 'confirm-banner-ok' : 'confirm-banner-cancel',
          )}
        >
          <span>{confirmed ? t('confirmedBanner') : t('cancelledBanner')}</span>
          <span className="text-xs opacity-70">
            {confirmed ? t('cliReturnedJson') : t('specNotEnabled')}
          </span>
        </div>
      )}

      <div className="main-layout">
        <main className="left-panel">
          <div className="left-panel-scroll">
            <SectionTitle>{t('structuredSpec')}</SectionTitle>
            <div className="flex flex-col gap-2.5 pb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-xs">{t('coreGoal')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableText
                    value={spec.understanding.goal}
                    placeholder={t('clickToEditGoal')}
                    onChange={(v) => updateField('understanding.goal', v)}
                    readOnly={isReadOnly}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-xs">
                    {t('assumptionsAndRisks')} ({spec.scope.assumptions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AssumptionsList
                    assumptions={spec.scope.assumptions}
                    onChange={(a) => updateField('scope.assumptions', a)}
                    readOnly={isReadOnly}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-xs">{t('scopeAndBoundaries')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableList
                    label={t('inScope')}
                    items={spec.scope.inScope}
                    color="green"
                    onChange={(v) => updateField('scope.inScope', v)}
                    readOnly={isReadOnly}
                  />
                  <EditableList
                    label={t('outOfScope')}
                    items={spec.scope.outOfScope}
                    color="red"
                    onChange={(v) => updateField('scope.outOfScope', v)}
                    readOnly={isReadOnly}
                  />
                  <EditableList
                    label={t('constraints')}
                    items={spec.scope.constraints}
                    color="yellow"
                    onChange={(v) => updateField('scope.constraints', v)}
                    readOnly={isReadOnly}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-xs">{t('techPlan')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <label className="label-sm">{t('architecture')}</label>
                    <EditableText
                      value={spec.plan.architecture}
                      placeholder={t('architectureDesc')}
                      onChange={(v) => updateField('plan.architecture', v)}
                      readOnly={isReadOnly}
                    />
                  </div>
                  <EditableList
                    label={t('techStack')}
                    items={spec.plan.techStack}
                    color="blue"
                    onChange={(v) => updateField('plan.techStack', v)}
                    readOnly={isReadOnly}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-xs">{t('inputOutput')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableList
                    label={t('acceptanceCriteria')}
                    items={spec.io.acceptanceCriteria}
                    color="green"
                    onChange={(v) => updateField('io.acceptanceCriteria', v)}
                    readOnly={isReadOnly}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-xs">
                    {t('questionsToClarify')} ({spec.questions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QuestionsList
                    questions={spec.questions}
                    onChange={(v) => updateField('questions', v)}
                    readOnly={isReadOnly}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <aside className="right-panel">
          <div className="flex flex-col min-h-0" style={{ flex: 1 }}>
            <div className="right-panel-scroll" style={{ flex: '0 0 50%' }}>
              <SectionTitle>{t('agentOriginalAnalysis')}</SectionTitle>
              <pre className="raw-analysis max-h-48 overflow-y-auto">{spec.input.analysis}</pre>
              <SectionTitle>{t('userOriginalRequest')}</SectionTitle>
              <pre className="raw-analysis max-h-32 overflow-y-auto">{spec.input.request}</pre>
            </div>

            <div className="px-4 py-2 flex-shrink-0" style={{ flex: '0 0 15%' }}>
              <div className="meta-row">
                <span>{t('status')}</span>
                <StatusBadge status={status} />
              </div>
              <div className="meta-row">
                <span>{t('created')}</span>
                <span>{formatTime(spec.meta.timestamp)}</span>
              </div>
              {spec.meta.confirmedAt && (
                <div className="meta-row">
                  <span>{t('confirmed')}</span>
                  <span>{formatTime(spec.meta.confirmedAt)}</span>
                </div>
              )}
            </div>

            <Card className="mx-4 flex flex-col min-h-0" style={{ flex: '0 0 35%' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary text-xs">{t('additionalNotes')}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 min-h-0">
                  <EditableText
                    value={spec.userAdditions.notes}
                    placeholder={t('anyAdditionalNotes')}
                    onChange={(v) => updateField('userAdditions.notes', v)}
                    multiline
                    className="h-full"
                    readOnly={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {!isReadOnly && (
            <div className="action-bar">
              <span className="text-xs text-slate-500">
                {saving ? t('saving') : t('autoSaved')}
              </span>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={saving}
                >
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleConfirm} disabled={saving}>
                  {t('confirmStart')}
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(220 30% 14%)',
            color: 'hsl(220 20% 92%)',
            border: '1px solid hsl(220 25% 18%)',
          },
        }}
      />

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('cancelTaskTitle')}</DialogTitle>
            <DialogDescription>{t('cancelTaskDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              {t('back')}
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              {t('confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
