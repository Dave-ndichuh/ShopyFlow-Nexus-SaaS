import { ThemeProvider } from '@/context/ThemeContext';

export default function AuthLayout({ children }) {
  return (
    <ThemeProvider>
      <div className="auth-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
        {children}
      </div>
    </ThemeProvider>
  );
}
