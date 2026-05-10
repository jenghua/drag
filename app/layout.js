import './globals.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const fontFaces = `
  @font-face {
    font-family: 'trajan';
    src: url('${BASE}/trajan.ttf') format('truetype');
    font-display: swap;
  }
  @font-face {
    font-family: 'amazon';
    src: url('${BASE}/amazon.ttf') format('truetype');
    font-display: swap;
  }
  @font-face {
    font-family: 'sacramento';
    src: url('${BASE}/Sacramento-Regular.ttf') format('truetype');
    font-display: swap;
  }
  @font-face {
    font-family: 'elegant';
    src: url('${BASE}/elegant.otf') format('opentype');
    font-display: swap;
  }
  @font-face {
    font-family: 'w3';
    src: url('${BASE}/DFT_TX3.ttf') format('truetype');
    font-display: swap;
  }
`;

export const metadata = {
  title: 'DaWood Design',
  description: '拖曳式文字設計工具',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <head>
        <style dangerouslySetInnerHTML={{ __html: fontFaces }} />
      </head>
      <body className="bg-stone-50 min-h-screen">{children}</body>
    </html>
  );
}
