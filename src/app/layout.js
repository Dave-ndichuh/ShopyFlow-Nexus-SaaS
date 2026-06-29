import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthProvider from '@/components/AuthGuard';

export const metadata = {
  title: 'Nexus POS | Retail Management SaaS',
  description: 'Premium Point of Sale and Multi-Branch Inventory Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/vendor/bootstrap/css/bootstrap.min.css" as="style" />
        <link rel="stylesheet" href="/vendor/bootstrap/css/bootstrap.min.css" />
        <link rel="preload" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" as="style" />
        <link
          rel="stylesheet"
          href="https://use.fontawesome.com/releases/v5.8.1/css/all.css"
          integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/assets/css/templatemo-chain-app-dev.css" as="style" />
        <link rel="stylesheet" href="/assets/css/templatemo-chain-app-dev.css" />
        <link rel="preload" href="/assets/css/animated.css" as="style" />
        <link rel="stylesheet" href="/assets/css/animated.css" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <div className="app-layout">
              <Sidebar />
              <div className="main-content">
                <Topbar />
                <main className="page-content">
                  {children}
                </main>
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
