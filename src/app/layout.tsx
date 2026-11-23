
import type { Metadata } from 'next';
import { Open_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { RevealInit } from '@/components/site/reveal';
import { Toaster } from '@/components/ui/toaster';
// import { ChatbotWidget } from '@/components/shared/chatbot-widget';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Sibiah Star School',
    default: 'Sibiah Star Pre-school, Primary & Junior School',
  },
  description: 'Welcome to Sibiah Star Pre-school, Primary & Junior School. Nurturing young minds for a bright future with modern facilities, transport services, excellent academics, and focus on character development.',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} ${playfair.variable} font-sans antialiased flex flex-col min-h-screen`} suppressHydrationWarning={true}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-accent-foreground">
            Skip to main content
          </a>
          <RevealInit />
          <SiteHeader />
          <main id="main" className="flex-grow">
            {children}
          </main>
          <SiteFooter />
          <Toaster />
          {/* <ChatbotWidget /> */}
      </body>
    </html>
  );
}
