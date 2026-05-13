'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Draggable from 'react-draggable';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const FONTS = [
  { value: 'trajan',     label: '英文正體字 (Trajan)' },
  { value: 'amazon',     label: '英文草寫一 (Amazon)' },
  { value: 'sacramento', label: '英文草寫二 (Sacramento)' },
  { value: 'elegant',    label: '中文秀風體' },
  { value: 'w3',         label: '中文鐵線體' },
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
      try { await document.fonts.load(`16px "${newFont}"`); }
      finally { setFontLoading(false); }
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
      const { width, height } = canvasRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const offscreen = document.createElement('canvas');
      offscreen.width  = Math.round(width * dpr);
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
          if (ir > cr) { dw = width;  dh = width / ir;  dx = 0; dy = (height - dh) / 2; }
          else         { dh = height; dw = height * ir;  dy = 0; dx = (width - dw) / 2;  }
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
        ctx.save();
        ctx.translate(position.x + tw / 2, position.y + th / 2);
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
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-stone-50">

      {/* ── Header ── */}
      <header className="shrink-0 h-12 bg-white border-b border-stone-100 flex items-center justify-center px-4">
        <img src={`${BASE}/dawoodesign.png`} alt="DaWood Design" className="h-7 w-auto" />
      </header>

      {/* ── Canvas：flex-1 + min-h-0 填滿剩餘高度 ── */}
      <div className="flex-1 min-h-0 p-3">
        <div
          ref={canvasRef}
          className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-md"
          style={{
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
      </div>

      {/* ── Controls：shrink-0 固定在底部 ── */}
      <div className="shrink-0 bg-white border-t border-stone-100 px-4 pt-3 pb-4 space-y-3">

        {/* 文字輸入 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入文字，按 Enter 或套用…"
            className="flex-1 h-10 px-4 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          <button
            onClick={handleApply}
            className="shrink-0 h-10 px-5 bg-stone-900 text-white text-sm rounded-xl hover:bg-stone-700 active:bg-stone-800 transition-colors font-medium"
          >
            套用
          </button>
        </div>

        {/* 字體預覽：輸入即時顯示，不需先套用 */}
        <div
          className="h-9 px-4 flex items-center justify-center overflow-hidden rounded-xl bg-stone-50 border border-stone-100"
          style={fontLoading ? {} : { fontFamily, fontSize: '1.25rem', color: '#292524' }}
        >
          {fontLoading
            ? <span className="text-xs text-stone-400 animate-pulse">字體載入中…</span>
            : <span className="text-stone-400 truncate">{inputValue || '預覽文字…'}</span>}
        </div>

        {/*
          手機 (grid-cols-2)：
            字體   → col-span-2（獨佔一行）
            大小   → col 1
            旋轉   → col 2
            下載   → col-span-2（獨佔一行）
          桌面 sm+ (grid-cols-[11rem_1fr_1fr_auto])：
            字體 | 大小 | 旋轉 | 下載  ← 同一行
        */}
        <div className="grid grid-cols-2 sm:grid-cols-[11rem_1fr_1fr_auto] gap-x-3 gap-y-3 items-end">

          {/* 字體 */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">字體</span>
              {fontLoading && <span className="text-xs text-stone-400 animate-pulse">載入中…</span>}
            </div>
            <select
              value={fontFamily}
              onChange={handleFontChange}
              className="w-full h-10 px-3 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 cursor-pointer"
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* 大小 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">大小</span>
              <span className="text-xs font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-full">{fontSize}px</span>
            </div>
            <input
              type="range" min="12" max="36" value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
          </div>

          {/* 旋轉 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">旋轉</span>
              <span className="text-xs font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-full">{rotation}°</span>
            </div>
            <input
              type="range" min="0" max="360" value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
          </div>

          {/* 下載 */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="col-span-2 sm:col-span-1 h-10 px-5 bg-stone-900 text-white text-sm rounded-xl hover:bg-stone-700 active:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isDownloading ? '處理中…' : '↓ 下載'}
          </button>
        </div>
      </div>
    </div>
  );
}
