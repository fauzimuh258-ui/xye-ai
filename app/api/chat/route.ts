import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, input } = body;

    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    const res = await fetch('https://zey-ai.vercel.app/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'vvbam988',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `[MODE: ${mode || 'WRITE'}]\n\n${input}` }],
        model: 'gpt-oss-120b',
        max_tokens: 2048,
        temperature: 0.3,
        stream: false,
      }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || 'No response';

    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
      }
