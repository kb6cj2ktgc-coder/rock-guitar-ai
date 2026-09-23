import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function fallbackReply(question: string, coach: string) {
  const text = question.toLowerCase();

  if (/^(hi|hello|hey|yo)\b/.test(text)) {
    return `Hey! I'm your ${coach}. What would you like to work on: chords, rhythm, riffs, soloing, or a practice plan?`;
  }

  if (text.includes('banana')) {
    return 'A banana is a soft, sweet fruit that grows in bunches and contains carbohydrates and potassium. Now let’s get back to guitar whenever you’re ready.';
  }

  if (text.includes('em chord') || text.includes('e minor') || text.includes('em cord')) {
    return 'To play an E minor chord, place your index finger on the 2nd fret of the A string and your middle finger on the 2nd fret of the D string. Leave the other strings open and strum all six strings. Play each string individually to make sure they ring clearly.';
  }

  if (text.includes('am chord') || text.includes('a minor')) {
    return 'For an A minor chord, place your index finger on the 1st fret of the B string, middle finger on the 2nd fret of the D string, and ring finger on the 2nd fret of the G string. Strum from the A string down.';
  }

  if (text.includes('c chord') || text.includes('c major')) {
    return 'For a C major chord, place your index finger on the 1st fret of the B string, middle finger on the 2nd fret of the D string, and ring finger on the 3rd fret of the A string. Strum from the A string down.';
  }

  if (text.includes('practice') || text.includes('practice plan')) {
    return 'Try this 20-minute plan: 5 minutes of warm-ups, 5 minutes of chord changes, 5 minutes of rhythm practice, and 5 minutes playing a song slowly. Keep everything clean before increasing the speed.';
  }

  return `I’m mainly your guitar coach. Ask me about a chord, riff, song, technique, tone, or practice plan, and I’ll give you step-by-step help.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const coach =
      typeof body.coach === 'string'
        ? body.coach
        : 'Rock Guitar Coach';

    const question =
      typeof body.question === 'string'
        ? body.question.trim()
        : '';

    if (!question) {
      return NextResponse.json(
        {
          message: 'Ask me a guitar question and I will help you.'
        },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        message: fallbackReply(question, coach),
        demo: true
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

    const userPrompt = `
Coach mode: ${coach}

Player message: ${question}
`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n${userPrompt}`
                }
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

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', data);

      return NextResponse.json(
        {
          message: 'The coach could not answer right now. Check the Vercel logs.'
        },
        { status: 500 }
      );
    }

    const message =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('')
        .trim() || '';

    return NextResponse.json({
      message:
        message ||
        'Tell me what you want to learn on guitar and I’ll help you get started.'
    });
  } catch (error) {
    console.error('Coach route error:', error);

    return NextResponse.json(
      {
        message: 'The coach could not answer right now. Check the Vercel logs.'
      },
      { status: 500 }
    );
  }
}
