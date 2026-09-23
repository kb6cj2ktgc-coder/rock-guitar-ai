'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { coaches } from '@/lib/coaches';

type Message = { role: 'user' | 'assistant'; content: string };

const starterPrompts = [
  'Make me a 20-minute practice plan for today',
  'How do I play a clean power chord?',
  'Help me learn my first rock guitar solo',
  'Why does my alternate picking sound uneven?',
];

export default function CoachApp() {
  const [coach, setCoach] = useState(coaches[0]?.name || 'Rock Guitar Coach');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hey! I'm your Rock Guitar AI coach. Ask me anything about chords, riffs, solos, technique, tone, or practice and I'll help you improve.",
    },
  ]);

  const selectedCoach = useMemo(
    () => coaches.find((item) => item.name === coach)?.name || coach,
    [coach],
  );

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis?.getVoices?.() ?? [];
      setVoices(available);
      if (!selectedVoice && available.length > 0) {
        setSelectedVoice(available[0].name);
      }
    };

    loadVoices();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoice]);

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function speakText(text: string) {
    if (!('speechSynthesis' in window) || !text.trim()) return;

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice =
      voices.find((item) => item.name === selectedVoice) ||
      voices.find((item) => item.lang.startsWith('en')) ||
      null;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }

  async function askCoach(event?: FormEvent<HTMLFormElement>, prompt?: string) {
    event?.preventDefault();
    const question = (prompt ?? input).trim();
    if (!question || loading) return;

    setInput('');
    setMessages((current) => [...current, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach: selectedCoach, question }),
      });
      const data = await response.json();
      const reply = data.message || 'Keep your hands relaxed and focus on clean notes.';

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: reply },
      ]);

      speakText(reply);
    } catch {
      const fallback = 'I could not connect right now. Please try again in a moment.';
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: fallback },
      ]);

      speakText(fallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0d12] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between border-b border-white/10 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl">🎸</div>
            <div>
              <p className="text-lg font-bold">Rock Guitar AI</p>
              <p className="text-xs text-slate-400">Your personal guitar coach</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              Coach
              <select
                value={coach}
                onChange={(event) => setCoach(event.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200 outline-none"
              >
                {coaches.map((item) => (
                  <option className="bg-slate-900" key={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-400">
              Voice
              <select
                value={selectedVoice}
                onChange={(event) => setSelectedVoice(event.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200 outline-none"
              >
                {voices.length === 0 ? (
                  <option value="">Loading...</option>
                ) : (
                  voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <button
              type="button"
              onClick={stopSpeaking}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Stop
            </button>
          </div>
        </header>

        <section className="flex flex-1 flex-col py-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[.25em] text-orange-400">AI guitar coach</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">What do you want to learn?</h1>
              <p className="mt-3 text-slate-400">Get clear, encouraging advice tailored to your playing.</p>
            </div>

            <div className="space-y-5 pb-8">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-sm">
                      🎸
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-7 ${
                      message.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'border border-white/10 bg-white/5 text-slate-100'
                    }`}
                  >
                    {message.content}
                    {message.role === 'assistant' && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => speakText(message.content)}
                          className="rounded-full border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[.15em] text-orange-200"
                        >
                          Listen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">🎸</div>
                  <span>Coach is thinking...</span>
                </div>
              )}
            </div>

            {messages.length === 1 && (
              <div className="mb-6 grid gap-2 sm:grid-cols-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => askCoach(undefined, prompt)}
                    className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-left text-sm text-slate-200 transition hover:bg-white/[.06]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={askCoach}
              className="sticky bottom-4 rounded-2xl border border-white/15 bg-[#151821] p-2 shadow-2xl shadow-black/30"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      askCoach();
                    }
                  }}
                  placeholder="Ask your guitar coach anything..."
                  rows={1}
                  className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-[15px] text-white outline-none placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              <p className="px-3 pb-1 text-[11px] text-slate-500">Press Enter to send · Shift + Enter for a new line</p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
