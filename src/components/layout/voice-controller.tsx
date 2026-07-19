'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function VoiceController() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('🎙 Listening... Say commands like "Add Rice" or "Open Billing"');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      toast.success(`Voice Command: "${transcript}"`);

      if (transcript.includes('billing') || transcript.includes('bill')) {
        router.push('/billing');
      } else if (transcript.includes('product') || transcript.includes('catalog')) {
        router.push('/products');
      } else if (transcript.includes('category') || transcript.includes('categories')) {
        router.push('/categories');
      } else if (transcript.includes('inventory') || transcript.includes('stock')) {
        router.push('/inventory');
      } else if (transcript.includes('sale') || transcript.includes('report')) {
        router.push('/sales');
      } else if (transcript.includes('setting')) {
        router.push('/settings');
      } else {
        router.push(`/billing?search=${encodeURIComponent(transcript)}`);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice command error. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <button
      onClick={startListening}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
        isListening
          ? 'bg-danger text-white border-danger animate-pulse'
          : 'bg-accent/50 hover:bg-accent text-foreground border-border'
      }`}
      title="Voice Navigation"
    >
      <span>{isListening ? '🔴 Listening...' : '🎙 Voice'}</span>
    </button>
  );
}
