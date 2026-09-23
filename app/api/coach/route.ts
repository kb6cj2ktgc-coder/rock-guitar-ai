import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function fallbackReply(
  question: string,
  coach: string,
  history: ConversationMessage[] = [],
): string {
  const text = question.toLowerCase().trim();
  const previousUserMessage = [...history]
    .reverse()
    .find((message) => message.role === 'user')?.content;
  const context = previousUserMessage
    ? ` You were asking about “${previousUserMessage}.”`
    : '';

  if (
    text.includes('confused') ||
    text.includes("don't understand") ||
    text.includes('do not understand') ||
    text === 'idk' ||
    text.includes('not sure') ||
    text.includes('what do you mean')
  ) {
    return previousUserMessage
      ? `No problem—let’s slow it down and go step by step with “${previousUserMessage}.” Which part is confusing: the finger placement, the picking, the rhythm, or the speed? I can explain it another way and recommend a demonstration video.`
      : `No problem. What would you like help with—chords, riffs, rhythm, solos, technique, tone, or a practice plan? Tell me what is confusing and I’ll explain it step by step.`;
  }

  if (/^(hi|hello|hey|yo)\b/.test(text)) {
    return `Hey! I'm your ${coach}. What would you like to work on today?`;
  }

  if (text.includes('how are you') || text.includes('how are things')) {
    return `I'm doing great and ready to help you play guitar! What would you like to practice today?`;
  }

  if (text.includes('riff') || text.includes('riffs')) {
    return `Here’s a simple way to learn a rock riff: first listen to it and divide it into short phrases. Practice each phrase slowly, one or two notes at a time. Use alternate picking, keep your fretting hand relaxed, and use a metronome. Once you can play it cleanly several times, increase the tempo gradually. If you tell me the song or riff, I can break down the exact notes and technique.${context}`;
  }

  if (text.includes('power chord') || text.includes('power chords')) {
    return `To play a power chord, place your index finger on the root note and your ring finger two frets higher on the next string. Pick only those strings, keep your fingers relaxed, and move the shape to different frets. Would you like an example in E5 or A5?`;
  }

  if (text.includes('practice')) {
    return 'Try this 20-minute plan: five minutes of warm-ups, five minutes of chord changes, five minutes of rhythm practice, and five minutes playing a song slowly. Keep everything clean before increasing the speed. What skill would you like the plan to focus on?';
  }

  return previousUserMessage
    ? `I’m here with you. Let’s continue with “${previousUserMessage}.” Tell me which part you want explained, and I’ll break it into simple steps. Would you like a written explanation or a demonstration video suggestion?`
    : `I’m your guitar coach, and you can ask me naturally about anything related to guitar. What would you like to learn?`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coach = typeof body.coach === 'string' ? body.coach : 'Rock Guitar Coach';
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const history: ConversationMessage[] = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (message: ConversationMessage) =>
              (message.role === 'user' || message.role === 'assistant') &&
              typeof message.content === 'string',
          )
          .slice(-12)
      : [];

    if (!question) {
      return NextResponse.json(
        { message: 'Ask me a guitar question and I will help you.' },
        { status: 400 },
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        message: fallbackReply(question, coach, history),
        demo: true,
      });
    }

    const systemPrompt = `
You are Rock Guitar AI, a warm, patient conversational guitar coach.

Use the conversation history. Treat short follow-ups such as “I'm confused,” “I don't know,” “what?”, “that one,” or “how?” as follow-ups to the previous user message, not as brand-new unrelated questions.
If the user is confused or vague, acknowledge that, refer to the relevant earlier topic, and ask one helpful clarifying question. Offer to explain it step by step or suggest a demonstration video, but do not claim to create or show a video unless the app actually supports that.
Answer naturally in complete paragraphs, not canned keyword responses.
Answer the exact question first, even when it is not about guitar. For guitar questions, give practical step-by-step advice.
For chord questions, include finger placement by string and fret, which strings to strum or avoid, and one checking tip.
Interpret typos such as “EM cord” as “Em chord” and “rough” as “riff” when the conversation makes that likely.
Never claim to hear the player unless audio was provided.
`;

    const contents = [
      ...history.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      {
        role: 'user',
        parts: [{ text: question }],
      },
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
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', data);
      return NextResponse.json({
        message: fallbackReply(question, coach, history),
        demo: true,
        apiError: response.status,
      });
    }

    const message = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim() || '';

    if (!message) {
      return NextResponse.json({
        message: fallbackReply(question, coach, history),
        demo: true,
      });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Coach route error:', error);
    return NextResponse.json({
      message: fallbackReply('I need help', 'Rock Guitar Coach'),
      demo: true,
    });
  }
}
