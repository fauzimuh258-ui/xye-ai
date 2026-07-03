import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xye AI — Coding & Debugging Specialist',
  description: 'AI-powered coding, debugging, review, optimization, and explanation assistant.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
