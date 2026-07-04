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
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2048,
        temperature: 0.3,
        stream: false,
      }),
    });

    const data = await res.json();
    console.log('Gateway response:', JSON.stringify(data).slice(0, 300));

    const content = 
      data?.content ||
      data?.choices?.[0]?.message?.content ||
      data?.error ||
      JSON.stringify(data);

    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
      }
