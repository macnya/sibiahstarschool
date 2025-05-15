import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { ChatbotWidget } from '@/components/shared/chatbot-widget';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Moved title and description to individual pages for better SEO and specificity
// export const metadata: Metadata = {
//   title: {
//     template: '%s | Sibiah Star School',
//     default: 'Sibiah Star Pre-school, Primary & Junior School',
//   },
//   description: 'Welcome to Sibiah Star Pre-school, Primary & Junior School. Nurturing young minds for a bright future with modern facilities, transport services, excellent academics, and focus on character development.',
//   icons: {
//     icon: '/favicon.ico', // Placeholder, actual favicon not generated
//   }
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <Toaster />
        <ChatbotWidget />
      </body>
    </html>
  );
}
