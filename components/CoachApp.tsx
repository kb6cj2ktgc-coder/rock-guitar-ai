'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { coaches, plan } from '@/lib/coaches';

type Goal = 'Fundamentals' | 'Soloing' | 'Rhythm' | 'Technique' | 'Songs';

const goals: Goal[] = ['Fundamentals', 'Soloing', 'Rhythm', 'Technique', 'Songs'];
const levels = ['Beginner', 'Intermediate', 'Advanced'];

export default function CoachApp() {
  const [name, setName] = useState('Rock guitarist');
  const [level, setLevel] = useState('Beginner');
  const [goal, setGoal] = useState<Goal>('Fundamentals');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'practice' | 'coach'>('dashboard');
  const [completed, setCompleted] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [question, setQuestion] = useState('How can I improve my playing today?');
  const [answer, setAnswer] = useState('Your coach is ready. Ask about your technique, practice plan, or next goal.');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('rock-guitar-profile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        setName(profile.name || 'Rock guitarist');
        setLevel(profile.level || 'Beginner');
        setGoal(profile.goal || 'Fundamentals');
        setCompleted(profile.completed || []);
      } catch { /* Ignore invalid local data. */ }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('rock-guitar-profile', JSON.stringify({ name, level, goal, completed }));
  }, [name, level, goal, completed]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const completedMinutes = Math.floor(seconds / 60);
  const progress = Math.round((completed.length / plan.length) * 100);
  const selectedCoach = useMemo(() => coaches.find((coach) => coach.name.toLowerCase().includes(goal.toLowerCase().replace('fundamentals', 'beginner'))) || coaches[0], [goal]);
  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  function toggleExercise(index: number) {
    setCompleted((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index]);
  }

  async function askCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coach: selectedCoach.name, question: `${question}\nPlayer level: ${level}\nGoal: ${goal}` }) });
      const data = await response.json();
      setAnswer(data.message || 'Keep your hands relaxed, slow down, and focus on clean notes.');
    } catch {
      setAnswer('The coach is temporarily unavailable. Try again in a moment.');
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen"><div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
    <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between"><div><p className="text-sm uppercase tracking-[.25em] text-orange-400">Rock Guitar AI</p><h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Welcome back, {name}.</h1><p className="mt-2 text-slate-400">Your personalized path to stronger riffs, chords, and solos.</p></div><div className="flex items-center gap-3"><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center"><p className="text-xs text-slate-400">Current streak</p><p className="text-xl font-bold text-orange-300">{completed.length ? '1 day' : 'Start today'}</p></div><button onClick={() => { setName('Rock guitarist'); setLevel('Beginner'); setGoal('Fundamentals'); setCompleted([]); }} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-orange-400 hover:text-white">Reset</button></div></header>
    <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-2">{([['dashboard','Dashboard'],['practice','Practice session'],['coach','Ask AI coach']] as const).map(([key,label]) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === key ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}>{label}</button>)}</nav>

    {activeTab === 'dashboard' && <div className="mt-8 space-y-8"><section className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-6 md:col-span-2"><p className="text-xs uppercase tracking-[.2em] text-orange-200">Today&apos;s focus</p><h2 className="mt-2 text-3xl font-black text-white">{goal} with the {selectedCoach.name}</h2><p className="mt-3 max-w-xl text-orange-100">Your plan adapts to your {level.toLowerCase()} level. Complete each exercise, then ask your AI coach what to work on next.</p><button onClick={() => setActiveTab('practice')} className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50">Start practice</button></div><div className="rounded-3xl border border-white/10 bg-white/5 p-6"><p className="text-xs uppercase tracking-[.2em] text-slate-400">Today&apos;s progress</p><p className="mt-3 text-4xl font-black text-white">{progress}%</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-sm text-slate-400">{completed.length} of {plan.length} exercises complete</p></div></section><section><p className="text-xs uppercase tracking-[.2em] text-slate-400">Your coaching team</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{coaches.map((coach) => <button key={coach.name} onClick={() => { setGoal(coach.name.includes('Solo') ? 'Soloing' : coach.name.includes('Chord') ? 'Rhythm' : coach.name.includes('Technique') ? 'Technique' : coach.name.includes('Song') ? 'Songs' : 'Fundamentals'); setActiveTab('coach'); }} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-1 hover:border-orange-400/50"><span className="text-3xl">{coach.icon}</span><h3 className="mt-3 font-bold text-white">{coach.name}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{coach.description}</p></button>)}</div></section></div>}

    {activeTab === 'practice' && <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><div className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-orange-300">Practice session</p><h2 className="mt-2 text-3xl font-bold text-white">{goal} routine</h2></div><div className="flex items-center gap-2"><span className="font-mono text-2xl text-white">{formattedTime}</span><button onClick={() => setTimerRunning(!timerRunning)} className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white">{timerRunning ? 'Pause' : 'Start timer'}</button></div></div><div className="mt-6 space-y-3">{plan.map((item,index) => <button key={item.title} onClick={() => toggleExercise(index)} className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${completed.includes(index) ? 'border-green-400/40 bg-green-500/10' : 'border-white/10 bg-[#11131a] hover:border-orange-400/40'}`}><span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${completed.includes(index) ? 'border-green-300 bg-green-400 text-black' : 'border-white/20 text-slate-400'}`}>{completed.includes(index) ? '✓' : index + 1}</span><span><span className="flex flex-wrap gap-3 font-semibold text-white"><span>{item.title}</span><span className="text-xs font-normal text-orange-300">{item.time}</span></span><span className="mt-1 block text-sm text-slate-400">{item.text}</span></span></button>)}</div></div><aside className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-6"><p className="text-xs uppercase tracking-[.2em] text-orange-200">Session notes</p><h3 className="mt-3 text-2xl font-bold text-white">Stay relaxed.</h3><p className="mt-3 text-sm leading-6 text-orange-100">Clean notes at a slow tempo become fast notes later. Stop if your wrist or fingers feel pain.</p><button onClick={() => setActiveTab('coach')} className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-bold text-orange-700">Get coaching feedback</button></aside></section>}

    {activeTab === 'coach' && <section className="mt-8 grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><div className="rounded-3xl border border-white/10 bg-white/5 p-6"><p className="text-xs uppercase tracking-[.2em] text-slate-400">Personalize your coach</p><label className="mt-5 block text-sm text-slate-300">Your name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 text-white outline-none focus:border-orange-400" /></label><label className="mt-4 block text-sm text-slate-300">Skill level<select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 text-white outline-none focus:border-orange-400">{levels.map((item) => <option key={item}>{item}</option>)}</select></label><label className="mt-4 block text-sm text-slate-300">Main goal<select value={goal} onChange={(event) => setGoal(event.target.value as Goal)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 text-white outline-none focus:border-orange-400">{goals.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-6"><p className="text-xs uppercase tracking-[.2em] text-orange-200">{selectedCoach.icon} {selectedCoach.name}</p><h2 className="mt-3 text-3xl font-bold text-white">Ask anything about your playing.</h2><form onSubmit={askCoach} className="mt-6 space-y-3"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} className="w-full resize-none rounded-2xl border border-white/10 bg-[#11131a] px-4 py-3 text-white outline-none focus:border-orange-400" placeholder="Ask about a riff, chord change, solo, or practice problem..." /><button disabled={loading} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-orange-700 disabled:opacity-60">{loading ? 'Coach is thinking...' : 'Ask the AI coach'}</button></form><div className="mt-6 rounded-2xl border border-white/10 bg-[#11131a] p-5"><p className="text-xs uppercase tracking-[.2em] text-orange-300">Coach feedback</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{answer}</p></div></div></section>}
  </div></main>;
}
