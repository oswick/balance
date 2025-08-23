import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import MainLayout from '@/components/layout/main-layout';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Balance',
  description: 'Your small business accounting companion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className={cn('font-body antialiased min-h-screen')}>
        <MainLayout>{children}</MainLayout>
        <Toaster />
      </body>
    </html>
  );
}
