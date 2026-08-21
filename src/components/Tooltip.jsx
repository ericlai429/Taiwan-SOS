import React, { useState } from 'react';

export default function Tooltip({ text, children, position = 'top' }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => {
        setShow(true);
        setTimeout(() => setShow(false), 2500);
      }}
    >
      {children}
      {show && text && (
        <div
          className={`absolute z-[3500] whitespace-nowrap bg-slate-900/95 border-2 border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md transition-all pointer-events-none animate-fadeIn ${
            position === 'top'
              ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
              : position === 'bottom'
              ? 'top-full mt-1.5 left-1/2 -translate-x-1/2'
              : position === 'left'
              ? 'right-full mr-1.5 top-1/2 -translate-y-1/2'
              : 'left-full ml-1.5 top-1/2 -translate-y-1/2'
          }`}
          style={{
            fontSize: 'clamp(12px, 2.2vw, 15px)',
            color: '#cbd5e1' // 質感深灰/藍灰色說明文字
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
