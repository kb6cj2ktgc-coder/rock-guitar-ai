import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coach = typeof body.coach === 'string' ? body.coach : 'Beginner Rock Coach';
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question) return NextResponse.json({ message: 'Ask me a guitar question and I will help you build a practice plan.' }, { status: 400 });

    if (!client) return NextResponse.json({ message: `${coach}: Start slowly, use a metronome, and prioritize relaxed hands and clean notes. Practice one focused exercise for 10 minutes, then record yourself and listen back.` });

    const result = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are Rock Guitar AI, a practical and encouraging guitar coach. Give concise, actionable guidance for beginners and advanced players. Cover rock rhythm, chords, solos, technique, and songs. Never claim to hear a recording unless audio analysis is provided.' },
        { role: 'user', content: `Coach mode: ${coach}\nQuestion: ${question}` }
      ],
      temperature: 0.7,
      max_tokens: 250
    });
    return NextResponse.json({ message: result.choices[0]?.message?.content || 'Keep the tempo steady and focus on clean, relaxed playing.' });
  } catch {
    return NextResponse.json({ message: 'The coach could not answer right now. Check your setup and try again.' }, { status: 500 });
  }
}
