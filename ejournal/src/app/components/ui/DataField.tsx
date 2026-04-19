interface Props {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}

import React from 'react';

export function DataField({ label, value, mono, className = '' }: Props) {
  return (
    <div className={`${className}`}>
      <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className={`text-gray-900 text-sm ${mono ? 'font-mono' : ''}`}>{value || <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}
