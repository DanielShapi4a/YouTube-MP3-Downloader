import { useCallback, useState } from 'react';
import type { LogEntry } from '../types';

type AddLog = (type: LogEntry['type'], message: string) => void;

export function useAppLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback<AddLog>((type, message) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };

    setLogs((prev) => [...prev.slice(-99), newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}
