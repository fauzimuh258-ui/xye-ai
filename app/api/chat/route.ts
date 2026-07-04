import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, input } = body;

    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    const res = await fetch('https://api.cloudflare.com/client/v4/accounts/8c9cbf3dc700e1e7b731b52e94bf6c9d/ai/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
      },
      body: JSON.stringify({
        model: '@cf/meta/llama-3-8b-instruct',
        input: {
          messages: [
            { role: 'system', content: `You are Xye AI, a coding specialist. Mode: ${mode || 'WRITE'}. Keep responses concise.` },
            { role: 'user', content: input },
          ],
        },
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    const data = await res.json();
    const content = data?.result?.response || 'No response';

    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
  }
