import './globals.css';

export const metadata = {
  title: 'DaWood Design',
  description: '拖曳式文字設計工具',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body className="bg-stone-50 min-h-screen">{children}</body>
    </html>
  );
}
