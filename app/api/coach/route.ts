import { NextRequest, NextResponse } from 'next/server';

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
    const history = cleanHistory(body.messages);

    if (!question) {
      return NextResponse.json(
        { error: 'Tell me what you would like help with.' },
        { status: 400 },
      );
    }

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured.');
      return NextResponse.json(
        { error: 'Gemini is not configured. Add GEMINI_API_KEY to the deployment environment.' },
        { status: 500 },
      );
    }

    const systemPrompt = `You are Rock Guitar AI, a patient, warm, conversational guitar coach.

Always use the conversation history. Short messages such as "I'm confused", "I don't know", "what?", "next", and "how?" are follow-ups to the previous topic. Do not restart the conversation and do not give a generic introduction.

If the player is confused, refer to the exact previous topic and ask which part is confusing. If they say "next", give the next practical step for the previous topic. If a word is unclear or seems like a voice-typing mistake, infer the most likely guitar meaning from the history and ask a brief clarification only when necessary.

Answer naturally in complete paragraphs. Give practical, step-by-step guitar help. Keep track of the player's topic. Do not claim to provide or show a video unless a video feature actually exists; you may suggest what to search for.
`;

    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text: string }>;
    }> = [
      ...history.map((message) => ({
        role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: message.content }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ];

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
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
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            `Gemini could not answer the request (HTTP ${response.status}).`,
        },
        { status: 502 },
      );
    }

    const message = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();

    if (!message) {
      return NextResponse.json(
        { error: 'Gemini returned an empty response. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Coach route error:', error);
    return NextResponse.json(
      { error: 'The Gemini request failed. Please try again.' },
      { status: 502 },
    );
  }
}
