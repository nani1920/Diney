import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import DomainGuard from '@/components/auth/DomainGuard';

const outfit = Outfit({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Diney | Order Now',
  description: 'Fast QR-Based Food Ordering Specialist',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <StoreProvider>
          <DomainGuard />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
