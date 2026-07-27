import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SQLLens | Understand SQL at a Glance',
  description:
    'SQL made visual. Break down queries, understand execution, and learn SQL faster.',
  keywords: [
    'SQL',
    'SQL visualizer',
    'SQL explainer',
    'SQL parser',
    'developer tools',
    'learn SQL',
  ],
  authors: [{ name: 'SQLLens' }],
  openGraph: {
    title: 'SQLLens | Understand SQL at a Glance',
    description:
      'Turn SQL queries into simple visual execution steps and plain-English explanations.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
