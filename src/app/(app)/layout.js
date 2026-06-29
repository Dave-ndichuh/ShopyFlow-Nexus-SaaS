import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthProvider from '@/components/AuthGuard';

export default function AppLayout({ children }) {
  return (
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
  );
}
