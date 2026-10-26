import React from 'react';

const logoSrc = `${import.meta.env.BASE_URL}assets/brand/replate-logo.png`;

interface ReplateLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  tagline?: string;
  taglineClassName?: string;
}

export const ReplateLogo: React.FC<ReplateLogoProps> = ({
  variant = 'compact',
  className = '',
  tagline,
  taglineClassName = '',
}) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <img
      src={logoSrc}
      alt=""
      aria-hidden="true"
      className="h-9 w-9 shrink-0 object-contain"
    />
    {variant !== 'icon' && (
      <span className="flex min-w-0 flex-col">
        <span className="font-['Outfit'] text-[19px] font-bold leading-none tracking-[0.02em] text-current">
          REPLATE
        </span>
        {variant === 'full' && tagline && (
          <span className={`mt-1 text-[9px] font-medium leading-tight text-current/65 ${taglineClassName}`}>
            {tagline}
          </span>
        )}
      </span>
    )}
  </span>
);

export default ReplateLogo;