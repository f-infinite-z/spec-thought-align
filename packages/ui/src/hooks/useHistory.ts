import { useState, useEffect } from 'react';

export function useHistory(taskId: string): {
  history: string[];
  activeId: string;
  setActiveId: (id: string) => void;
  removeHistory: (id: string) => void;
} {
  const [history, setHistory] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string>(taskId);

  useEffect(() => {
    if (!taskId) return;
    const stored = localStorage.getItem('spec-align-history');
    const current: string[] = stored ? JSON.parse(stored) : [];
    const newHistory = [taskId, ...current.filter((id) => id !== taskId)].slice(0, 3);
    localStorage.setItem('spec-align-history', JSON.stringify(newHistory));
    setHistory(newHistory);
    setActiveId(taskId);
  }, [taskId]);

  const removeHistory = (id: string) => {
    const updated = history.filter((h) => h !== id);
    localStorage.setItem('spec-align-history', JSON.stringify(updated));
    setHistory(updated);
    if (activeId === id && updated.length > 0) {
      setActiveId(updated[0]);
    }
  };

  return { history, activeId, setActiveId, removeHistory };
}
