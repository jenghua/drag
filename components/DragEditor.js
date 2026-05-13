'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Draggable from 'react-draggable';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const FONTS = [
  { value: 'trajan',    label: '英文正體字 (Trajan)' },
  { value: 'amazon',    label: '英文草寫一 (Amazon)' },
  { value: 'sacramento',label: '英文草寫二 (Sacramento)' },
  { value: 'elegant',   label: '中文秀風體' },
  { value: 'w3',        label: '中文鐵線體' },
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
    FONTS.forEach(({ value }) => document.fonts.load(`16px "${value}"`));
  }, []);

  const handleApply = useCallback(() => {
    if (inputValue.trim()) setText(inputValue);
  }, [inputValue]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && inputValue.trim()) setText(inputValue);
  }, [inputValue]);

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
      await document.fonts.ready;

      const container = canvasRef.current;
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const offscreen = document.createElement('canvas');
      offscreen.width = Math.round(width * dpr);
      offscreen.height = Math.round(height * dpr);
      const ctx = offscreen.getContext('2d');
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

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

      if (text) {
        ctx.font = `${fontSize}px "${fontFamily}"`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000000';
        const tw = ctx.measureText(text).width;
        const th = fontSize;
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
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-stone-100 py-3 px-6">
        <img
          src={`${BASE}/dawoodesign.png`}
          alt="DaWood Design"
          className="h-9 w-auto mx-auto"
        />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4 p-4 sm:p-6 max-w-4xl mx-auto w-full">

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative w-full rounded-2xl overflow-hidden bg-white shadow-md"
          style={{
            aspectRatio: '4/3',
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
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 space-y-4">

          {/* Text input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入文字，按 Enter 或套用…"
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
            <button
              onClick={handleApply}
              className="px-5 py-2.5 bg-stone-900 text-white text-sm rounded-xl hover:bg-stone-700 active:bg-stone-800 transition-colors font-medium shrink-0"
            >
              套用
            </button>
          </div>

          {/* Font preview */}
          {text && (
            <div
              className="px-4 py-2.5 bg-stone-50 rounded-xl border border-stone-100 text-center overflow-hidden min-h-[2.75rem] flex items-center justify-center"
              style={fontLoading ? {} : { fontFamily, fontSize: '1.4rem', color: '#292524' }}
            >
              {fontLoading
                ? <span className="text-xs text-stone-400 animate-pulse">字體載入中…</span>
                : text}
            </div>
          )}

          {/* 3-col controls: font | size | rotation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Font */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">字體</label>
              <select
                value={fontFamily}
                onChange={handleFontChange}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 cursor-pointer"
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">文字大小</label>
                <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="36"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer mt-1"
              />
              <div className="flex justify-between text-xs text-stone-400">
                <span>12</span><span>36</span>
              </div>
            </div>

            {/* Rotation */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest">旋轉</label>
                <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">{rotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer mt-1"
              />
              <div className="flex justify-between text-xs text-stone-400">
                <span>0°</span><span>360°</span>
              </div>
            </div>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-700 active:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm tracking-wide"
          >
            {isDownloading ? '處理中…' : '↓ 下載圖片'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-stone-400">
        &copy; {new Date().getFullYear()} DaWood Design
      </footer>
    </div>
  );
}
