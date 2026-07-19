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
import { Loader2Icon } from '@/components/icons';
import { VoiceController } from './voice-controller';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = input;
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentQuery }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to communicate with AI Copilot');
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), sender: 'assistant', text: data.reply },
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-primary/20"
          aria-label="Open AI Copilot"
        >
          <span className="text-xl">🤖</span>
          <span className="hidden sm:inline">AI Copilot</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <span>🤖 AI POS Copilot</span>
          </SheetTitle>
          <VoiceController />
        </SheetHeader>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted/70 text-foreground border rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
              <Loader2Icon className="w-4 h-4 animate-spin text-primary" />
              <span>AI Copilot thinking...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-3 border-t bg-card flex gap-2">
          <Input
            placeholder="Ask AI Copilot... (e.g. 'Show low stock')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
