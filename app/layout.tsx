import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SQLLens | Understand SQL at a Glance',
  description:
    'SQL made visual. Break down queries, understand execution, learn faster.',
  keywords: [
    'SQL',
    'SQL visualizer',
    'SQL explainer',
    'SQL parser',
    'developer tools',
    'learn SQL',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
