import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { AdminProvider } from '@/context/AdminContext';
import { OrderProvider } from '@/context/OrderContext';
import { CartProvider } from '@/context/CartContext';
import DomainGuard from '@/components/auth/DomainGuard';

const outfit = Outfit({ 
  subsets: ['latin'],
  display: 'swap',
});

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
      <body className={outfit.className} suppressHydrationWarning={true}>
        <StoreProvider>
          <AdminProvider>
            <CartProvider>
              <OrderProvider>
                <DomainGuard />
                {children}
              </OrderProvider>
            </CartProvider>
          </AdminProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
