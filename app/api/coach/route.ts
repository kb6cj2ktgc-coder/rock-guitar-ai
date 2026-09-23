import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function fallbackReply(question: string, coach: string): string {
  const text = question.toLowerCase().trim();

  if (/^(hi|hello|hey|yo)\b/.test(text)) {
    return `Hey! I'm your ${coach}. What would you like to work on: chords, rhythm, riffs, soloing, or a practice plan?`;
  }

  if (text.includes('how are you') || text.includes('how are things')) {
    return `I'm doing great and ready to help you play guitar! What would you like to practice today?`;
  }

  if (text.includes('banana')) {
    return 'A banana is a soft, sweet fruit that grows in bunches and contains carbohydrates and potassium. Now let’s get back to guitar whenever you’re ready.';
  }

  if (text.includes('riff') || text.includes('riffs')) {
    return 'To learn a rock riff, start slowly and practice one or two notes at a time. Use alternate picking, keep your fretting hand relaxed, and repeat the riff with a metronome. Once you can play it cleanly several times, gradually increase the tempo.';
  }

  if (
    text.includes('em chord') ||
    text.includes('e minor') ||
    text.includes('em cord')
  ) {
    return 'To play an E minor chord, place your index finger on the 2nd fret of the A string and your middle finger on the 2nd fret of the D string. Leave the other strings open and strum all six strings. Play each string individually to make sure they ring clearly.';
  }

  if (
    text.includes('am chord') ||
    text.includes('a minor') ||
    text.includes('am cord')
  ) {
    return 'For an A minor chord, place your index finger on the 1st fret of the B string, middle finger on the 2nd fret of the D string, and ring finger on the 2nd fret of the G string. Strum from the A string down and avoid the low E string.';
  }

  if (text.includes('c chord') || text.includes('c major')) {
    return 'For a C major chord, place your index finger on the 1st fret of the B string, middle finger on the 2nd fret of the D string, and ring finger on the 3rd fret of the A string. Strum from the A string down and avoid the low E string.';
  }

  if (text.includes('g chord') || text.includes('g major')) {
    return 'For a G major chord, place your middle finger on the 3rd fret of the low E string, index finger on the 2nd fret of the A string, and ring finger on the 3rd fret of the high E string. Strum all six strings.';
  }

  if (text.includes('d chord') || text.includes('d major')) {
    return 'For a D major chord, place your index finger on the 2nd fret of the G string, middle finger on the 2nd fret of the high E string, and ring finger on the 3rd fret of the B string. Strum only the highest four strings.';
  }

  if (
    text.includes('power chord') ||
    text.includes('power chords')
  ) {
    return 'For a power chord, place your index finger on the root note and your ring finger two frets higher on the next string. Pick only those strings and keep your fingers relaxed.';
  }

  if (
    text.includes('practice') ||
    text.includes('practice plan') ||
    text.includes('what should i practice')
  ) {
    return 'Try this 20-minute plan: 5 minutes of warm-ups, 5 minutes of chord changes, 5 minutes of rhythm practice, and 5 minutes playing a song slowly. Keep everything clean before increasing the speed.';
  }

  if (text.includes('strum') || text.includes('rhythm')) {
    return 'Practice steady down-up strokes with a metronome. Start slowly, keep your hand moving evenly, and add chord changes without stopping the rhythm.';
  }

  if (text.includes('solo') || text.includes('scale')) {
    return 'Start with the minor pentatonic scale in one position. Play it slowly, then create short phrases using only a few notes. Leave space between phrases and keep a steady rhythm.';
  }

  return `I’m mainly your guitar coach. Ask me about a chord, riff, song, technique, tone, or practice plan, and I’ll give you step-by-step help.`;
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
      return NextResponse.json({
        message: fallbackReply(question, coach),
        demo: true,
      });
    }

    const systemPrompt = `
You are Rock Guitar AI, a friendly conversational guitar coach.

Answer the user's exact question first, even when it is not about guitar.
For general questions, give a brief accurate answer and then invite the user back to guitar.
For guitar questions, give practical step-by-step advice.
For chord questions, include finger placement by string and fret, which strings to strum or avoid, and one checking tip.
Interpret typos such as "EM cord" as "Em chord".
Never claim to hear the player unless audio was provided.
`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\nPlayer message: ${question}` }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 350,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', data);

      if (response.status === 503) {
        return NextResponse.json({
          message: fallbackReply(question, coach),
          demo: true,
        });
      }

      return NextResponse.json({
        message: fallbackReply(question, coach),
        demo: true,
        apiError: response.status,
      });
    }

    const message =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('')
        .trim() || '';

    if (!message) {
      return NextResponse.json({
        message: fallbackReply(question, coach),
        demo: true,
      });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Coach route error:', error);
    return NextResponse.json({
      message: fallbackReply('general guitar help', 'Rock Guitar Coach'),
      demo: true,
    });
  }
}
