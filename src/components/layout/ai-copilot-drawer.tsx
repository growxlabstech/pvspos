'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2Icon, TrashIcon } from '@/components/icons';
import { VoiceController } from './voice-controller';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  layout?: {
    type: 'EXECUTIVE_SUMMARY' | 'TABLE' | 'CHART' | 'TIMELINE' | 'ALERTS' | 'RECOMMENDATIONS' | 'NONE';
    kpis?: Array<{
      label: string;
      value: string;
      change?: string;
      trend?: 'up' | 'down' | 'neutral';
    }>;
    table?: {
      headers: string[];
      rows: Array<Record<string, string | number>>;
    };
    chart?: {
      type: 'BAR' | 'LINE' | 'PIE' | 'AREA';
      title?: string;
      data: Array<{ name: string; value: number }>;
    };
    timeline?: Array<{
      title: string;
      time: string;
      description?: string;
      status?: 'success' | 'warning' | 'info';
    }>;
    alerts?: Array<{
      type: 'CRITICAL' | 'WARNING' | 'SUCCESS' | 'INFO';
      message: string;
    }>;
    recommendations?: Array<{
      text: string;
      checked?: boolean;
    }>;
  };
  suggestions?: Array<{
    label: string;
    command: string;
  }>;
}

// 1. KPI Cards (Executive Summary)
function ExecutiveSummary({ kpis }: { kpis: any[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 my-3 w-full animate-[fade-in_0.3s_ease-out]">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="bg-card p-3 rounded-xl border border-muted/80 shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold font-mono text-foreground">{kpi.value}</span>
            {kpi.change && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                kpi.trend === 'up' ? 'bg-green-500/10 text-green-600' :
                kpi.trend === 'down' ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground'
              }`}>
                {kpi.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// 2. Interactive Data Table
function CopilotTable({ table }: { table: { headers: string[]; rows: any[] } }) {
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 4;

  const rows = table.rows || [];
  const headers = table.headers || [];

  const filtered = rows.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(filter.toLowerCase())
    )
  );

  if (sortCol) {
    filtered.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
  }

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
    setPage(0);
  };

  return (
    <div className="border rounded-xl bg-card my-3 p-3 space-y-2 w-full max-w-full overflow-hidden shadow-sm animate-[fade-in_0.3s_ease-out]">
      <input
        type="text"
        placeholder="Filter list..."
        value={filter}
        onChange={e => { setFilter(e.target.value); setPage(0); }}
        className="w-full h-8 px-3 rounded-lg border text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-muted/20"
      />
      <div className="overflow-x-auto border rounded-lg max-w-full">
        <table className="w-full text-[11px] text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b">
              {headers.map(h => (
                <th 
                  key={h} 
                  onClick={() => handleSort(h)}
                  className="p-2 font-semibold text-muted-foreground cursor-pointer hover:bg-muted/80 select-none whitespace-nowrap"
                >
                  {h} {sortCol === h ? (sortAsc ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="p-4 text-center text-muted-foreground">
                  No matching items.
                </td>
              </tr>
            ) : (
              paginated.map((row, rIdx) => (
                <tr key={rIdx} className="border-b last:border-0 hover:bg-muted/30">
                  {headers.map(h => {
                    const val = row[h];
                    const valStr = String(val ?? '');
                    const isStatus = h.toLowerCase().includes('status') || h.toLowerCase().includes('stock') || h.toLowerCase().includes('quantity');
                    const isLow = valStr.toLowerCase().includes('low') || valStr.toLowerCase().includes('out') || valStr === '0' || Number(val) < 5;
                    const isOk = valStr.toLowerCase().includes('completed') || valStr.toLowerCase().includes('success') || valStr.toLowerCase().includes('active');
                    
                    return (
                      <td key={h} className="p-2 font-mono whitespace-nowrap">
                        {isStatus ? (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isLow ? 'bg-red-500/10 text-red-600' :
                            isOk ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {valStr}
                          </span>
                        ) : valStr}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="h-6 px-2 text-[10px] border rounded bg-card hover:bg-muted disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="h-6 px-2 text-[10px] border rounded bg-card hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. CSS Charts with animations
function CopilotChart({ chart }: { chart: { type: string; title?: string; data: any[] } }) {
  const data = chart.data || [];
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="border rounded-xl bg-card my-3 p-3.5 space-y-3 w-full shadow-sm animate-[fade-in_0.3s_ease-out]">
      {chart.title && <h4 className="text-xs font-semibold text-foreground tracking-tight">{chart.title}</h4>}
      
      {chart.type === 'PIE' ? (
        <div className="space-y-2">
          {data.map((d, idx) => {
            const sum = data.reduce((acc, curr) => acc + curr.value, 0);
            const pct = sum > 0 ? Math.round((d.value / sum) * 100) : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-medium text-muted-foreground">{d.name}</span>
                  <span className="font-bold text-foreground">{d.value} ({pct}%)</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${pct}%`, transitionDelay: `${idx * 100}ms` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-end justify-between h-32 pt-4 border-b border-muted">
          {data.map((d, idx) => {
            const pct = Math.round((d.value / maxVal) * 100);
            return (
              <div key={idx} className="flex flex-col items-center flex-1 group relative">
                <div className="absolute -top-6 scale-0 group-hover:scale-100 transition-transform bg-foreground text-background text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none z-10 font-mono">
                  {d.value}
                </div>
                <div 
                  className="w-6 bg-primary/80 rounded-t hover:bg-primary transition-all duration-1000 ease-out cursor-pointer"
                  style={{ height: `${Math.max(pct, 5)}%`, transitionDelay: `${idx * 75}ms` }}
                />
                <span className="text-[9px] text-muted-foreground mt-2 truncate max-w-[40px] font-mono">{d.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 4. Timeline logs
function CopilotTimeline({ timeline }: { timeline: any[] }) {
  return (
    <div className="border rounded-xl bg-card my-3 p-4 space-y-3 w-full shadow-sm animate-[fade-in_0.3s_ease-out]">
      <div className="relative pl-4 border-l border-muted space-y-4">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative">
            <span className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-card ring-4 ring-card ${
              item.status === 'success' ? 'bg-green-500' :
              item.status === 'warning' ? 'bg-amber-500' : 'bg-primary'
            }`} />
            <div className="space-y-0.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-foreground">{item.title}</span>
                <span className="text-[9px] text-muted-foreground font-mono">{item.time}</span>
              </div>
              {item.description && (
                <p className="text-[10px] text-muted-foreground leading-relaxed">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Alert notifications
function CopilotAlerts({ alerts }: { alerts: any[] }) {
  return (
    <div className="space-y-2 my-3 w-full animate-[fade-in_0.3s_ease-out]">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`p-3 rounded-xl border flex gap-3 items-start ${
          alert.type === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-700' :
          alert.type === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' :
          alert.type === 'SUCCESS' ? 'bg-green-500/10 border-green-500/20 text-green-700' :
          'bg-blue-500/10 border-blue-500/20 text-blue-700'
        }`}>
          <span className="text-sm leading-none">
            {alert.type === 'CRITICAL' ? '🚨' :
             alert.type === 'WARNING' ? '⚠️' :
             alert.type === 'SUCCESS' ? '✅' : 'ℹ️'}
          </span>
          <div className="space-y-0.5 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wide">
              {alert.type || 'Alert'}
            </span>
            <p className="text-[11px] leading-relaxed opacity-95">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// 6. Recommendation checkboxes
function CopilotRecommendations({ recommendations }: { recommendations: any[] }) {
  return (
    <div className="border rounded-xl bg-card my-3 p-4 space-y-3 w-full shadow-sm animate-[fade-in_0.3s_ease-out]">
      <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider">Manager Recommendations</h4>
      <div className="space-y-2">
        {recommendations.map((rec, idx) => (
          <label key={idx} className="flex gap-2.5 items-start cursor-pointer group text-[11px]">
            <input 
              type="checkbox" 
              defaultChecked={rec.checked || false}
              className="mt-0.5 h-3.5 w-3.5 rounded border-muted-foreground text-primary focus:ring-primary cursor-pointer shrink-0" 
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed select-none">
              {rec.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Formatted bold text renderer
function renderFormattedText(text: string) {
  if (!text) return '';
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function AiCopilotDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am your **PVS POS AI Copilot**. Ask me anything about your revenue, inventory, low stock items, or system commands!',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('copilot_messages_v2');
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored copilot messages:', e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('copilot_messages_v2', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleClearChat = () => {
    const defaultMsg: Message = {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am your **PVS POS AI Copilot**. Ask me anything about your revenue, inventory, low stock items, or system commands!',
    };
    setMessages([defaultMsg]);
    localStorage.setItem('copilot_messages_v2', JSON.stringify([defaultMsg]));
    toast.success('Chat history cleared');
  };

  const handleSend = async (customInput?: string) => {
    const query = (customInput || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to communicate with AI Copilot');
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { 
            id: (Date.now() + 1).toString(), 
            sender: 'assistant', 
            text: data.reply,
            layout: data.layout || undefined,
            suggestions: data.suggestions || undefined
          },
        ]);
      }

      if (data.action?.type === 'NAVIGATE') {
        setTimeout(() => {
          setOpen(false);
          router.push(data.action.payload);
        }, 1200);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'assistant', text: `⚠️ Error: ${err.message || 'Please try again.'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (command: string) => {
    handleSend(command);
  };

  // Find last assistant message's suggestions
  const assistantMessages = messages.filter(m => m.sender === 'assistant');
  const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
  const suggestions = lastAssistantMsg?.suggestions || [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-primary/20 animate-bounce"
          aria-label="Open AI Copilot"
        >
          <span className="text-xl">🤖</span>
          <span className="hidden sm:inline">AI Copilot</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l shadow-2xl">
        <SheetHeader className="p-4 border-b flex flex-row items-center justify-between bg-card/50 backdrop-blur-md">
          <SheetTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <span>🤖 AI POS Copilot</span>
          </SheetTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              title="Clear chat history"
              className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-lg cursor-pointer transition-colors"
            >
              <TrashIcon size={16} />
            </Button>
            <VoiceController />
          </div>
        </SheetHeader>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-muted/5 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              } w-full`}
            >
              <div
                className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line leading-relaxed shadow-sm transition-all border ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                    : 'bg-card text-foreground border-muted rounded-tl-none'
                }`}
              >
                {renderFormattedText(msg.text)}
              </div>
              
              {/* Layout Renderer */}
              {msg.sender === 'assistant' && msg.layout && msg.layout.type !== 'NONE' && (
                <div className="w-[90%] pl-1">
                  {(msg.layout.type === 'EXECUTIVE_SUMMARY' || (msg.layout.type as string) === 'EX_SUMMARY') && msg.layout.kpis && (
                    <ExecutiveSummary kpis={msg.layout.kpis} />
                  )}
                  {msg.layout.type === 'TABLE' && msg.layout.table && (
                    <CopilotTable table={msg.layout.table} />
                  )}
                  {msg.layout.type === 'CHART' && msg.layout.chart && (
                    <CopilotChart chart={msg.layout.chart} />
                  )}
                  {msg.layout.type === 'TIMELINE' && msg.layout.timeline && (
                    <CopilotTimeline timeline={msg.layout.timeline} />
                  )}
                  {msg.layout.type === 'ALERTS' && msg.layout.alerts && (
                    <CopilotAlerts alerts={msg.layout.alerts} />
                  )}
                  {msg.layout.type === 'RECOMMENDATIONS' && msg.layout.recommendations && (
                    <CopilotRecommendations recommendations={msg.layout.recommendations} />
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground p-2 animate-pulse">
              <Loader2Icon className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>AI Manager analyzing store data...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions Quick actions */}
        {!isLoading && suggestions.length > 0 && (
          <div className="px-3 py-2 border-t bg-muted/20 flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.command)}
                className="px-3 py-1.5 rounded-full border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 text-[10px] font-medium transition-all active:scale-95 cursor-pointer shrink-0"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Box */}
        <div className="p-3 border-t bg-card flex gap-2">
          <Input
            placeholder="Ask AI Copilot... (e.g. 'Show low stock')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="flex-1 text-xs"
          />
          <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="text-xs">
            Send
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
