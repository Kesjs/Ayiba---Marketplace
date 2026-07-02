import React from 'react';

export default function LogoAyiba({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 320 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Icône Monogramme Fusion A + Y */}
      <g id="Monogram-AY">
        {/* Jambe gauche du A */}
        <path d="M45 25L20 80" stroke="#D85A30" strokeWidth="8" strokeLinecap="round"/>
        {/* Jambe droite du A qui descend pour faire la queue du Y */}
        <path d="M45 25L70 55V80" stroke="#D85A30" strokeWidth="8" strokeLinecap="round"/>
        {/* Bras droit du Y qui se détache */}
        <path d="M70 55L95 25" stroke="#D85A30" strokeWidth="8" strokeLinecap="round"/>
        {/* Barre du A style anse de panier de marché */}
        <path d="M30 60C38 64 52 64 60 60" stroke="#D85A30" strokeWidth="6" strokeLinecap="round"/>
        {/* Le Point Teal de la Sécurité / Validation sur le bras droit du Y */}
        <circle cx="95" cy="13" r="5.5" fill="#1D9E75"/>
      </g>

      {/* Texte "iba" aligné proprement */}
      <g id="Text-iba">
        <text 
          x="115" 
          y="80" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize="70" 
          fontWeight="500" 
          fill="#111827" 
          letterSpacing="-0.02em"
        >
          iba
        </text>
      </g>
    </svg>
  );
}
