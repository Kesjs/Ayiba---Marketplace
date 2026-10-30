import React from "react";

interface LogoAyibaDeliveryProps {
  className?: string;
}

/**
 * Sous-marque Delivery : le monogramme Ayiba est conservé et la ligne de
 * trajet teal traduit la spécialisation logistique sans créer une nouvelle
 * identité visuelle indépendante.
 */
export default function LogoAyibaDelivery({ className = "h-10 w-auto" }: LogoAyibaDeliveryProps) {
  return (
    <svg
      viewBox="0 0 430 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Ayiba Delivery"
    >
      <g>
        <path d="M45 24L20 78" stroke="#D85A30" strokeWidth="8" strokeLinecap="round" />
        <path d="M45 24L70 54V78" stroke="#D85A30" strokeWidth="8" strokeLinecap="round" />
        <path d="M70 54L95 24" stroke="#D85A30" strokeWidth="8" strokeLinecap="round" />
        <path d="M30 59C38 63 52 63 60 59" stroke="#D85A30" strokeWidth="6" strokeLinecap="round" />
        <circle cx="95" cy="13" r="5.5" fill="#1D9E75" />
      </g>
      <text x="115" y="67" fontFamily="system-ui, -apple-system, sans-serif" fontSize="57" fontWeight="500" fill="#111827" letterSpacing="-0.04em">iba</text>
      <path d="M119 88H302C319 88 327 76 337 76C347 76 352 88 366 88" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 7" />
      <circle cx="366" cy="88" r="5" fill="#D85A30" />
      <text x="307" y="64" fontFamily="system-ui, -apple-system, sans-serif" fontSize="15" fontWeight="700" fill="#1D9E75" letterSpacing="0.08em">DELIVERY</text>
    </svg>
  );
}
