import React, { useState } from 'react';

export default function Tooltip({ text, children, position = 'top' }) {
  const [touchShow, setTouchShow] = useState(false);

  if (!text) return children;

  const handleTouch = () => {
    setTouchShow(true);
    setTimeout(() => setTouchShow(false), 2500);
  };

  return (
    <div
      className="group relative inline-flex items-center"
      onTouchStart={handleTouch}
    >
      {children}
      <div
        className={`absolute z-[3500] whitespace-nowrap bg-slate-900/95 border-2 border-slate-700 text-slate-300 font-bold px-2.5 py-1 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-150 pointer-events-none ${
          touchShow ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
        } ${
          position === 'top'
            ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
            : position === 'bottom'
            ? 'top-full mt-1.5 left-1/2 -translate-x-1/2'
            : position === 'left'
            ? 'right-full mr-1.5 top-1/2 -translate-y-1/2'
            : 'left-full ml-1.5 top-1/2 -translate-y-1/2'
        }`}
        style={{
          fontSize: 'clamp(12px, 2.2vw, 14px)',
          color: '#cbd5e1' // 質感深灰/藍灰色說明文字 (minimum 12px)
        }}
      >
        {text}
      </div>
    </div>
  );
}
