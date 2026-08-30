import React from 'react';

export const DodoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Dodo Bird Body & Head */}
    <path
      d="M7 21C5.5 19 4.5 16 5.5 12.5C6.5 8.5 9.5 5.5 14.5 4.5C19.5 3.5 23.5 6.5 23.5 10.5C23.5 12.5 22.5 14.5 20.5 15.5C22.5 17.5 25.5 20.5 25.5 24.5C25.5 26.5 23.5 27.5 20.5 27.5C15.5 27.5 10.5 24.5 7 21Z"
      fill="currentColor"
    />
    {/* Hooked Beak */}
    <path
      d="M22.5 8.5C25.5 9 28.5 11 28.5 14.5C28.5 17 26.5 17.5 24.5 16.5C23 15.7 21.5 14.5 21.5 12.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Eye */}
    <circle cx="17.5" cy="9" r="1.5" fill="#121824" />
    {/* Wing Feather Line */}
    <path
      d="M10.5 15.5C12.5 17.5 15.5 18.5 18.5 17.5C16.5 20.5 13.5 22.5 9.5 22.5"
      stroke="#121824"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
