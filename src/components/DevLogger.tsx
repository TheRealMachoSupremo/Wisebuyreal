import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Download } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  data?: any;
  stack?: string;
}

class DevLogger {
  private static instance: DevLogger;
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private isDev = import.meta.env.DEV;

  static getInstance() {
    if (!DevLogger.instance) {
      DevLogger.instance = new DevLogger();
    }
    return DevLogger.instance;
  }

  log(level: LogEntry['level'], component: string, message: string, data?: any, error?: Error) {
    if (!this.isDev) return;
    
    const entry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      stack: error?.stack
    };
    
    this.logs.unshift(entry);
    if (this.logs.length > 1000) this.logs = this.logs.slice(0, 1000);
    
    // Console output
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${component}] ${message}`, data || '');
    
    this.notifyListeners();
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  clear() {
    this.logs = [];
    this.notifyListeners();
  }

  export() {
    const data = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logger = DevLogger.getInstance();

export const DevLoggerPanel = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    return logger.subscribe(setLogs);
  }, []);

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.level === filter
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  if (!import.meta.env.DEV) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Developer Logs</CardTitle>
          <div className="flex gap-2">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-2 py-1 border rounded"
            >
              <option value="all">All</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <Button size="sm" variant="outline" onClick={() => logger.export()}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => logger.clear()}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-2 border rounded text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getLevelColor(log.level) as any}>
                    {log.level}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-semibold">{log.component}</span>
                </div>
                <div className="mb-1">{log.message}</div>
                {log.data && (
                  <pre className="text-xs bg-muted p-1 rounded overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
                {log.stack && (
                  <pre className="text-xs text-red-600 bg-red-50 p-1 rounded overflow-x-auto">
                    {log.stack}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};