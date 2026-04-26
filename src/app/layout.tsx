import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { AdminProvider } from '@/context/AdminContext';
import { OrderProvider } from '@/context/OrderContext';
import { CartProvider } from '@/context/CartContext';
import DomainGuard from '@/components/auth/DomainGuard';
import { Toaster } from 'react-hot-toast';

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
                <Toaster 
                    position="bottom-center"
                    toastOptions={{
                        style: {
                            background: '#171717',
                            color: '#fff',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '12px 16px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#fb923c',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
              </OrderProvider>
            </CartProvider>
          </AdminProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
