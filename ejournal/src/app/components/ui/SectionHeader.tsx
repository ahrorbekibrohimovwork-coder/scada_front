import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, icon, action, className = '' }: Props) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-gray-200 mb-4 ${className}`}>
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-gray-500">{icon}</span>}
        <div>
          <h3 className="text-gray-900 text-sm font-semibold tracking-tight uppercase">{title}</h3>
          {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
