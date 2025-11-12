import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { queryClient } from '@/lib/api/client';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MeatyMusic AMCS',
  description: 'Agentic Music Creation System - Transform structured creative intent into validated musical artifacts',
  keywords: [
    'music creation',
    'AI music',
    'song composition',
    'music generation',
    'AMCS',
    'agentic system',
  ],
  authors: [{ name: 'MeatyMusic Team' }],
  openGraph: {
    title: 'MeatyMusic AMCS',
    description: 'Agentic Music Creation System - Transform structured creative intent into validated musical artifacts',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeatyMusic AMCS',
    description: 'Agentic Music Creation System - Transform structured creative intent into validated musical artifacts',
  },
  robots: {
    index: process.env.NODE_ENV === 'production',
    follow: process.env.NODE_ENV === 'production',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="antialiased">
          <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
