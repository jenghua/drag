'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Draggable from 'react-draggable';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const FONTS = [
  { value: 'trajan', label: '英文正體字 (Trajan)' },
  { value: 'amazon', label: '英文草寫一 (Amazon)' },
  { value: 'sacramento', label: '英文草寫二 (Sacramento)' },
  { value: 'elegant', label: '中文秀風體' },
  { value: 'w3', label: '中文鐵線體' },
];

export default function DragEditor() {
  const [text, setText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('trajan');
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [fontLoading, setFontLoading] = useState(false);

  const draggableRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      setPosition({ x: width / 2, y: height / 2 });
    }
    // 背景預載所有字體，中文大字體（~35MB）需時較長但不阻塞 UI
    FONTS.forEach(({ value }) => document.fonts.load(`16px "${value}"`));
  }, []);

  const handleApply = useCallback(() => {
    if (inputValue.trim()) setText(inputValue);
  }, [inputValue]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && inputValue.trim()) setText(inputValue);
    },
    [inputValue]
  );

  const handleFontChange = useCallback(async (e) => {
    const newFont = e.target.value;
    setFontFamily(newFont);
    if (!document.fonts.check(`16px "${newFont}"`)) {
      setFontLoading(true);
      try {
        await document.fonts.load(`16px "${newFont}"`);
      } finally {
        setFontLoading(false);
      }
    }
  }, []);

  const handleDrag = useCallback((_, data) => {
    setPosition({ x: data.x, y: data.y });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsDownloading(true);
    try {
      // 等字體確認載入完成
      await document.fonts.ready;

      const container = canvasRef.current;
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const offscreen = document.createElement('canvas');
      offscreen.width = Math.round(width * dpr);
      offscreen.height = Math.round(height * dpr);
      const ctx = offscreen.getContext('2d');
      ctx.scale(dpr, dpr);

      // 白底
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 背景圖：模擬 background-size:contain + center
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const ir = img.naturalWidth / img.naturalHeight;
          const cr = width / height;
          let dw, dh, dx, dy;
          if (ir > cr) {
            dw = width; dh = width / ir;
            dx = 0;    dy = (height - dh) / 2;
          } else {
            dh = height; dw = height * ir;
            dy = 0;     dx = (width - dw) / 2;
          }
          ctx.drawImage(img, dx, dy, dw, dh);
          resolve();
        };
        img.onerror = resolve;
        img.src = `${BASE}/drag.png`;
      });

      // 文字：與畫面位置和旋轉同步
      if (text) {
        ctx.font = `${fontSize}px "${fontFamily}"`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000000';

        const tw = ctx.measureText(text).width;
        const th = fontSize;
        // react-draggable position 是元素左上角的偏移量，旋轉以元素中心為軸
        const cx = position.x + tw / 2;
        const cy = position.y + th / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.fillText(text, -tw / 2, -th / 2);
        ctx.restore();
      }

      const link = document.createElement('a');
      link.href = offscreen.toDataURL('image/png');
      link.download = 'dawoo-design.png';
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }, [text, position, rotation, fontSize, fontFamily]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-8 px-4">
        <div className="max-w-5xl mx-auto flex justify-center">
          <img
            src={`${BASE}/dawoodesign.png`}
            alt="DaWood Design"
            className="max-w-xs w-full"
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Canvas */}
          <div
            ref={canvasRef}
            className="relative w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-stone-200"
            style={{
              minHeight: '60dvh',
              backgroundImage: `url(${BASE}/drag.png)`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
          >
            <Draggable position={position} onDrag={handleDrag} nodeRef={draggableRef}>
              <div ref={draggableRef} className="inline-block cursor-move select-none">
                <span
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily,
                    transform: `rotate(${rotation}deg)`,
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {text}
                </span>
              </div>
            </Draggable>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-6">
            {/* Text Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
                輸入文字
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="輸入文字後按 Enter 或套用..."
                  className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                />
                <button
                  onClick={handleApply}
                  className="px-5 py-2.5 bg-stone-900 text-white text-sm rounded-xl hover:bg-stone-700 active:bg-stone-800 transition-colors font-medium"
                >
                  套用
                </button>
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">
                字體
              </label>
              <select
                value={fontFamily}
                onChange={handleFontChange}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 cursor-pointer"
              >
                {FONTS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
              {text && (
                <div
                  className="mt-3 px-4 py-3 bg-stone-50 rounded-xl text-center overflow-hidden border border-stone-100 min-h-[3rem] flex items-center justify-center"
                  style={fontLoading ? {} : { fontFamily, fontSize: '1.5rem', color: '#44403c' }}
                >
                  {fontLoading
                    ? <span className="text-xs text-stone-400 animate-pulse">字體載入中…</span>
                    : text}
                </div>
              )}
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
                  文字大小
                </label>
                <span className="text-sm font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                  {fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="36"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>12px</span>
                <span>36px</span>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
                  旋轉角度
                </label>
                <span className="text-sm font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                  {rotation}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>0°</span>
                <span>360°</span>
              </div>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-700 active:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm tracking-wide"
            >
              {isDownloading ? '處理中...' : '下載圖片'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-stone-400">
        &copy; {new Date().getFullYear()} DaWood Design
      </footer>
    </div>
  );
}
