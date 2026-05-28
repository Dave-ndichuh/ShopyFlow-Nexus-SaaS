import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Auto Spare Parts Management',
  description: 'Premium Point of Sale and Inventory Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-layout">
          <Sidebar />
          <div className="main-content">
            <Topbar />
            <main className="page-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
