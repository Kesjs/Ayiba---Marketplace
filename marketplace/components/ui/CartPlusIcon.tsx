import React from "react";

interface CartPlusIconProps {
  size?: number;
  className?: string;
}

export function CartPlusIcon({ size = 16, className = "" }: CartPlusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Roues */}
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      
      {/* Structure Chariot */}
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      
      {/* Symbole + dans le chariot */}
      <line x1="12" y1="9" x2="18" y2="9" />
      <line x1="15" y1="6" x2="15" y2="12" />
    </svg>
  );
}
