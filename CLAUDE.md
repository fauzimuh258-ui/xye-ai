# CLAUDE.md — Xye AI

## Cara Kerja Saya
- Build bertahap (Part 1-5)
- Review tiap Part sebelum lanjut
- Deploy ke Vercel setelah semua Part approved

## Error yang Sering Muncul
- Path alias @/ → gunakan relative path
- Groq 503 → ganti model ke llama-3.3-70b-versatile
- TypeScript error → pastikan devDependencies lengkap

## Tech Stack
- Next.js 14, Tailwind CSS, TypeScript
- Groq API (llama-3.3-70b-versatile)
- Vercel (hosting)

## Struktur Penting
- v2/ = versi terbaru
- lib/zey-search.ts = integrasi pencarian
- lib/self-correction.ts = loop koreksi diri

## Aturan
- Jangan pakai AI SDK, pakai vanilla fetch
- Stream false (jangan streaming)
- Environment: GROQ_API_KEY, ZEY_SEARCH_API_URL
