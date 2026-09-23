'use client';

import { FormEvent, useState } from 'react';
import { coaches } from '@/lib/coaches';

export default function CoachPanel() {
  const [coach, setCoach] = useState(coaches[0].name);
  const [question, setQuestion] = useState('What should I practice today?');
  const [answer, setAnswer] = useState('Choose a coach and ask anything about your rock guitar practice.');
  const [loading, setLoading] = useState(false);

  async function askCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach, question })
      });
      const data = await response.json();
      setAnswer(data.message || 'Try that exercise slowly and keep your hands relaxed.');
    } catch {
      setAnswer('The coach is temporarily unavailable. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-6">
      <p className="text-xs uppercase tracking-[.2em] text-orange-200">OpenAI guitar coach</p>
      <h2 className="mt-3 text-2xl font-bold text-white">Ask your coach</h2>
      <p className="mt-2 text-sm text-orange-100">Get practical guidance for riffs, chords, rhythm, technique, and solos.</p>
      <form onSubmit={askCoach} className="mt-5 space-y-3">
        <select value={coach} onChange={(event) => setCoach(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 text-sm text-white outline-none focus:border-orange-400">
          {coaches.map((item) => <option key={item.name}>{item.name}</option>)}
        </select>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-400" placeholder="Ask about your practice..." />
        <button type="submit" disabled={loading} className="w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60">{loading ? 'Coach is thinking...' : 'Ask the coach'}</button>
      </form>
      <div className="mt-5 rounded-2xl border border-white/10 bg-[#11131a] p-4">
        <p className="text-xs uppercase tracking-[.2em] text-orange-300">Coach feedback</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{answer}</p>
      </div>
    </div>
  );
}
