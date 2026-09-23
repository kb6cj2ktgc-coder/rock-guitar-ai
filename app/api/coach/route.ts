import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function fallbackReply(question: string, coach: string) {
  const text = question.toLowerCase();

  if (/^(hi|hello|hey|yo|good morning|good afternoon)\b/.test(text)) {
    return `Hey! I'm your ${coach}. What would you like to work on: chords, rhythm, riffs, soloing, or a practice plan?`;
  }
  if (text.includes('power chord')) {
    return 'For a clean power chord, place your index finger on the root note and use your ring finger two frets higher on the next string. Pick only those strings, keep your thumb relaxed, and slowly check that every note rings clearly.';
  }
  if (text.includes('practice') || text.includes('plan') || text.includes('today')) {
    return 'Here is a focused 20-minute plan: 5 minutes of slow warm-ups, 5 minutes of chord changes with a metronome, 5 minutes of a riff at a comfortable tempo, and 5 minutes recording yourself. Increase speed only when every note is clean.';
  }
  if (text.includes('solo') || text.includes('scale')) {
    return 'Start with the minor pentatonic scale in one position. Play it slowly in groups of four, then make a two-bar phrase using only three or four notes. Leave space between phrases and keep the rhythm steady.';
  }
  if (text.includes('pick') || text.includes('speed') || text.includes('fast')) {
    return 'For faster picking, use a metronome and begin far below your maximum speed. Play a short pattern for one minute with relaxed movement, then add only 5 BPM if it stays clean.';
  }
  if (text.includes('chord') || text.includes('strum')) {
    return 'For stronger rhythm playing, mute the strings lightly and practice steady down-up strokes with a metronome. Then add the chord changes one at a time without stopping the pulse.';
  }
  if (text.includes('tone') || text.includes('sound') || text.includes('amp')) {
    return 'Start with a clean or slightly overdriven tone while practicing. Too much gain can hide mistakes. Add gain gradually after your fretting and picking sound clean.';
  }

  return `Good question. As your ${coach}, I suggest starting slowly, isolating one skill, and using a metronome. Tell me whether you are working on chords, rhythm, riffs, soloing, tone, or a specific song, and I will give you a step-by-step exercise.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coach = typeof body.coach === 'string' ? body.coach : 'Rock Guitar Coach';
    const question = typeof body.question === 'string' ? body.question.trim() : '';

    if (!question) {
      return NextResponse.json({ message: 'Ask me a guitar question and I will help you.' }, { status: 400 });
    }

    if (!client) {
      return NextResponse.json({ message: fallbackReply(question, coach), demo: true });
    }

    const result = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Rock Guitar AI, a practical, encouraging guitar coach. Answer the player directly and conversationally. Give concise, actionable guidance for beginners and advanced players. Cover rock rhythm, chords, riffs, soloing, technique, tone, practice plans, and songs. Never claim to hear the player unless audio is provided. If the request is unrelated, politely guide it back to guitar.',
        },
        { role: 'user', content: `Coach mode: ${coach}\nPlayer question: ${question}` },
      ],
      temperature: 0.7,
      max_tokens: 350,
    });

    return NextResponse.json({ message: result.choices[0]?.message?.content || 'Keep the tempo steady and focus on clean, relaxed playing.' });
  } catch {
    return NextResponse.json({ message: 'The coach could not answer right now. Check your setup and try again.' }, { status: 500 });
  }
}
