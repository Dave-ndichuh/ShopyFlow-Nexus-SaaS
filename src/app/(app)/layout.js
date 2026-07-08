import '../globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthProvider from '@/components/AuthGuard';
import InstallPrompt from '@/components/InstallPrompt';

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
          <InstallPrompt />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
