import { NextRequest, NextResponse } from 'next/server';

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function fallbackReply(
  question: string,
  history: ConversationMessage[],
  coachName = 'Rock Guitar Coach',
): string {
  const text = question.toLowerCase().trim();
  const lastTopic = [...history]
    .reverse()
    .find((message) => message.role === 'user')?.content;
  const topic = lastTopic || 'that guitar question';

  if (
    text.includes('confused') ||
    text.includes("don't understand") ||
    text.includes('do not understand') ||
    text === 'idk' ||
    text === 'i dont know' ||
    text.includes('not sure') ||
    text === 'what' ||
    text === 'huh'
  ) {
    return lastTopic
      ? `No problem. Let’s slow down and go back to “${topic}.” Which part is confusing: the notes, the finger placement, the picking, or the rhythm? I can explain that part one step at a time.`
      : 'No problem. Tell me what you are trying to learn, and I will break it down one step at a time.';
  }

  if (
    text === 'next' ||
    text === 'next step' ||
    text.includes('what do i do next') ||
    text.includes('what now')
  ) {
    return lastTopic
      ? `The next step for “${topic}” is to practice it slowly for five minutes with a metronome. Stop after each mistake, fix the movement, and repeat it cleanly three times before going faster. When you are ready, tell me what happened and I will give you the next step.`
      : 'The next step is to tell me the guitar skill or song you want to work on, and I will guide you from there.';
  }

  if (/^(hi|hello|hey|yo)\b/.test(text)) {
    return `Hey! I’m ${coachName} and I’m ready to help. What would you like to learn on guitar today?`;
  }

  if (text.includes('riff') || text.includes('roof') || text.includes('ref')) {
    return 'To learn a rock riff, first divide it into small phrases. Practice one phrase slowly, one or two notes at a time. Keep your picking hand relaxed, use a metronome, and repeat the phrase cleanly three times before increasing the speed. If you tell me the song or riff, I can help break down the exact notes.';
  }

  if (text.includes('power chord') || text.includes('power chords')) {
    return 'To play a power chord, put your index finger on the root note and your ring finger two frets higher on the next string. Pick only those strings. Start slowly, check that both notes sound clean, and then move the shape to another fret.';
  }

  if (text.includes('practice')) {
    return 'Try this 20-minute plan: five minutes of warm-ups, five minutes of chord changes, five minutes of rhythm practice, and five minutes playing a song slowly. Keep everything clean before increasing the speed.';
  }

  return lastTopic
    ? `Let’s continue with “${topic}.” Tell me which part you want to do next, and I’ll explain it step by step.`
    : 'Tell me what you want to learn, and I’ll guide you through it step by step.';
}

function cleanHistory(value: unknown): ConversationMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (message): message is ConversationMessage =>
        !!message &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0,
    )
    .slice(-16);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const coach = typeof body.coach === 'string' ? body.coach : 'Rock Guitar Coach';
    const history = cleanHistory(body.messages);

    if (!question) {
      return NextResponse.json(
        { message: 'Tell me what you would like help with.' },
        { status: 400 },
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        message: fallbackReply(question, history, coach),
        demo: true,
      });
    }

    const systemPrompt = `You are Rock Guitar AI, a patient, warm, conversational guitar coach.

Always use the conversation history. Short messages such as "I'm confused", "I don't know", "what?", "next", and "how?" are follow-ups to the previous topic. Do not restart the conversation and do not give a generic introduction.

If the player is confused, refer to the exact previous topic and ask which part is confusing. If they say "next", give the next practical step for the previous topic. If a word is unclear or seems like a voice-typing mistake, infer the most likely guitar meaning from the history and ask a brief clarification only when necessary.

Answer naturally in complete paragraphs. Give practical, step-by-step guitar help. Keep track of the player's topic. Do not claim to provide or show a video unless a video feature actually exists; you may say you can suggest what to search for.
`;

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [
      ...history.map((message) => ({
        role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: message.content }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ];

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 600,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', data);
      return NextResponse.json({
        message: fallbackReply(question, history, coach),
        demo: true,
        apiError: response.status,
      });
    }

    const message = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();

    return NextResponse.json({
      message: message || fallbackReply(question, history, coach),
      demo: !message,
    });
  } catch (error) {
    console.error('Coach route error:', error);
    return NextResponse.json({
      message: 'I lost the connection for a moment. Please send that again and I will continue from our conversation.',
      demo: true,
    });
  }
}
