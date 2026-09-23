import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function fallbackReply(question: string, coach: string) {
  const text = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  if (/^(hi|hello|hey|yo|good morning|good afternoon)\b/.test(text)) {
    return `Hey! I'm your ${coach}. What would you like to work on: chords, rhythm, riffs, soloing, or a practice plan?`;
  }
  if (/\bbanana\b/.test(text)) {
    return 'A banana is a soft, sweet fruit that grows in bunches. It is a good source of carbohydrates and potassium. Now, whenever you are ready, let’s get back to guitar and work on your playing.';
  }
  if (/\b(e\s*minor|em|e minor)\s*(chord|cord)?\b/.test(text) || /how (do|can) i play.*\bem\b/.test(text)) {
    return 'To play an E minor (Em) chord: place your index finger on the 2nd fret of the 5th string (A), and your middle finger on the 2nd fret of the 4th string (D). Leave the other strings open, then strum all six strings. Pick each string once to check that every note rings clearly. Keep your thumb relaxed behind the neck, and slowly lift and replace your fingers until the chord sounds clean.';
  }
  if (/\b(a\s*minor|am|a minor)\s*(chord|cord)?\b/.test(text) || /how (do|can) i play.*\bam\b/.test(text)) {
    return 'For an A minor (Am) chord: put your index finger on the 1st fret of the B string, middle finger on the 2nd fret of the D string, and ring finger on the 2nd fret of the G string. Strum from the A string down, avoiding the low E string. Play each string slowly to make sure every note rings clearly.';
  }
  if (/\b(c\s*major|c major|c chord|c cord)\b/.test(text)) {
    return 'For a C major chord: place your index finger on the 1st fret of the B string, middle finger on the 2nd fret of the D string, and ring finger on the 3rd fret of the A string. Strum from the A string down and avoid the low E string. Check each note one at a time, then practice changing slowly to another chord.';
  }
  if (/\b(g\s*major|g major|g chord|g cord)\b/.test(text)) {
    return 'For a G major chord: place your middle finger on the 3rd fret of the low E string, index finger on the 2nd fret of the A string, and ring finger on the 3rd fret of the high E string. Strum all six strings. Start with slow chord changes and make sure the open strings ring clearly.';
  }
  if (/\b(d\s*major|d major|d chord|d cord)\b/.test(text)) {
    return 'For a D major chord: place your index finger on the 2nd fret of the G string, ring finger on the 3rd fret of the B string, and middle finger on the 2nd fret of the high E string. Strum only the highest four strings, starting from the D string.';
  }
  if (text.includes('power chord')) {
    return 'For a clean power chord, place your index finger on the root note and your ring finger two frets higher on the next string. Pick only those strings, keep your thumb relaxed, and slowly check that every note rings clearly.';
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
  if (text.includes('strum') || text.includes('rhythm')) {
    return 'For stronger rhythm playing, mute the strings lightly and practice steady down-up strokes with a metronome. Then add the chord changes one at a time without stopping the pulse.';
  }
  if (text.includes('tone') || text.includes('sound') || text.includes('amp')) {
    return 'Start with a clean or slightly overdriven tone while practicing. Too much gain can hide mistakes. Add gain gradually after your fretting and picking sound clean.';
  }

  return `That is an interesting question. I can answer simple general questions, but I am mainly your guitar coach. If you want to continue with guitar, ask me about a chord, riff, song, technique, tone, or practice plan and I’ll give you a useful step-by-step answer.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coach = typeof body.coach === 'string' ? body.coach : 'Rock Guitar Coach';
    const question = typeof body.question === 'string' ? body.question.trim() : '';

    if (!question) {
      return NextResponse.json(
        { message: 'Ask me a guitar question and I will help you.' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { message: fallbackReply(question, coach), demo: true },
        { status: 200 }
      );
    }

    const systemPrompt =
      'You are Rock Guitar AI, a friendly conversational guitar coach. Answer the user’s exact question first, even when it is not about guitar. For general questions, give a brief accurate answer, then naturally add one short sentence inviting them back to guitar. For guitar questions, give practical step-by-step advice. Interpret likely typos such as "EM cord" as "Em chord". For chord questions, give finger placement by string and fret, which strings to strum or avoid, and one checking tip. Never claim to hear the player unless audio is provided.';

    const userPrompt = `Coach mode: ${coach}\nPlayer message: ${question}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\n${userPrompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 350
          }
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Gemini error:', data);
      return NextResponse.json(
        { message: 'The coach could not answer right now. Check the Vercel logs.' },
        { status: 500 }
      );
    }

    const content =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text)
        .join('') || '';

    return NextResponse.json({
      message: content || 'Tell me what you want to learn on guitar and I’ll help you get started.'
    });
  } catch (error) {
    console.error('Coach/Gemini error:', error);
    return NextResponse.json(
      { message: 'The coach could not answer right now. Check the Vercel logs.' },
      { status: 500 }
    );
  }
}
