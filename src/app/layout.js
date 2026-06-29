export const metadata = {
  title: 'Nexus POS | Retail Management SaaS',
  description: 'Premium Point of Sale and Multi-Branch Inventory Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
