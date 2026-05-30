import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata = {
  title: 'Auto Spare Parts Management',
  description: 'Premium Point of Sale and Inventory Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <div className="app-layout">
            <Sidebar />
            <div className="main-content">
              <Topbar />
              <main className="page-content">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
