import React from 'react';

export default function BrandMark() {
  return (
    <svg
      className="brand-mark-art"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M32 4.5 55.8 18v27.5L32 59.5 8.2 45.5V18L32 4.5Z"
        fill="url(#apex-mark-shell)"
        fillOpacity=".2"
        stroke="url(#apex-mark-edge)"
        strokeWidth="1.5"
      />
      <path
        d="m15.5 44.5 14-27h6.2l13 27h-9l-7-15.6-8 15.6h-9.2Z"
        fill="#F5F7FF"
      />
      <path d="M25.2 38.2h15.1l3 6.3H22.1l3.1-6.3Z" fill="#AEB8FF" />
      <circle cx="45.5" cy="17.5" r="4.3" fill="#5EEAD4" />
      <circle cx="45.5" cy="17.5" r="7.5" stroke="#5EEAD4" strokeOpacity=".4" />
      <defs>
        <linearGradient id="apex-mark-shell" x1="10" y1="8" x2="53" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8291FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="apex-mark-edge" x1="10" y1="8" x2="53" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B6C0FF" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
