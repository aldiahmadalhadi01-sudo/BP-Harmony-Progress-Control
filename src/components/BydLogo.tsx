/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const BYD_LOGO_URL = '/assets/aistudio/byd-atualizada-2024-seeklogo_1bf5ea7d.png';

export interface BydLogoProps {
  className?: string;
  variant?: 'white' | 'dark' | 'silver' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
}

export const BydLogo: React.FC<BydLogoProps> = ({
  className = '',
  variant = 'white',
  size = 'md',
  alt = 'BYD - Build Your Dreams',
}) => {
  // Height presets for the wide horizontal 2024 BYD wordmark
  const sizeClasses = {
    xs: 'h-3.5 w-auto',
    sm: 'h-5 w-auto',
    md: 'h-6 w-auto',
    lg: 'h-8 w-auto',
    xl: 'h-10 w-auto',
  }[size] || 'h-6 w-auto';

  // Filter styles based on background
  const variantClasses = {
    white: 'brightness-0 invert',
    silver: 'brightness-0 invert opacity-90 drop-shadow-sm',
    dark: 'brightness-0 opacity-85',
    auto: '',
  }[variant] || 'brightness-0 invert';

  return (
    <img
      src={BYD_LOGO_URL}
      alt={alt}
      className={`inline-block object-contain shrink-0 transition-opacity select-none ${sizeClasses} ${variantClasses} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};
