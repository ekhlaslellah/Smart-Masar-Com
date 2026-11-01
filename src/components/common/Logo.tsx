/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { resolvePublicImageUrl } from '../../utils/imageUrl';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark'; // 'light' is for light backgrounds, 'dark' is for dark navy surfaces
  showTagline?: boolean;
  className?: string;
}

export const DEFAULT_LOGO_PATH =
  '/assets/aistudio/D666B97C-619E-459D-8A6A-33BEDB06BB76_d5572475.png';

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'light',
  className = '',
}) => {
  const { profile } = useApp();
  const isDark = variant === 'dark';

  const customLogoUrl = resolvePublicImageUrl(profile?.logo_url, profile?.logo_file_id);
  const [customFailed, setCustomFailed] = useState(false);
  const [defaultFailed, setDefaultFailed] = useState(false);

  useEffect(() => {
    setCustomFailed(false);
  }, [customLogoUrl]);

  // Height configurations for the official logo asset
  const logoHeights = {
    sm: 'h-8 sm:h-9',
    md: 'h-9 sm:h-11',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  };

  const containerPaddings = {
    sm: 'px-1.5 py-0.5 rounded-lg',
    md: 'px-2 py-0.5 rounded-xl',
    lg: 'px-3 py-1 rounded-2xl',
    xl: 'px-4 py-1.5 rounded-2xl',
  };

  const activeSrc =
    customLogoUrl && !customFailed ? customLogoUrl : DEFAULT_LOGO_PATH;

  const handleImageError = () => {
    if (customLogoUrl && !customFailed && activeSrc !== DEFAULT_LOGO_PATH) {
      setCustomFailed(true);
    } else {
      setDefaultFailed(true);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      dir="ltr"
      title="Smart Masar - سمارت مسار"
    >
      {!defaultFailed ? (
        <div
          className={`inline-flex items-center overflow-hidden transition-all duration-200 hover:scale-[1.02] bg-white ${
            isDark
              ? `shadow-md border border-[#00D2FF]/30 ${containerPaddings[size]}`
              : `shadow-2xs border border-slate-200/80 ${containerPaddings[size]}`
          }`}
        >
          <img
            src={activeSrc}
            alt={profile?.logo_alt_ar || 'Smart Masar - سمارت مسار'}
            onError={handleImageError}
            className={`${logoHeights[size]} w-auto object-contain`}
            loading="eager"
          />
        </div>
      ) : (
        /* Fallback Vector Emblem with the Road-S Concept if image loading fails */
        <div className="flex items-center gap-2.5">
          <div
            className={`relative shrink-0 flex items-center justify-center ${
              size === 'sm' ? 'w-8 h-9' : size === 'md' ? 'w-10 h-11' : 'w-14 h-16'
            }`}
          >
            <svg
              viewBox="0 0 54 62"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-md"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="roadGradFallback" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D2FF" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#7C5CDE" />
                </linearGradient>
                <linearGradient id="growthGradFallback" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#00D2FF" />
                </linearGradient>
              </defs>

              <rect x="22" y="4" width="4" height="10" rx="1.5" fill="url(#growthGradFallback)" />
              <rect x="28" y="2" width="4.5" height="12" rx="1.5" fill="url(#growthGradFallback)" />
              <rect x="34.5" y="0" width="5" height="14" rx="1.5" fill="url(#growthGradFallback)" />

              <path
                d="M44 16C44 9 37 5 27 5C17 5 11 10.5 11 18C11 26 19 29.5 27 32C35 34.5 43 38 43 47C43 55 36 60 26 60C14 60 8 54 8 46"
                stroke={isDark ? '#00D2FF' : '#10203B'}
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M44 16C44 9 37 5 27 5C17 5 11 10.5 11 18C11 26 19 29.5 27 32C35 34.5 43 38 43 47C43 55 36 60 26 60C14 60 8 54 8 46"
                stroke="url(#roadGradFallback)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M44 16C44 9 37 5 27 5C17 5 11 10.5 11 18C11 26 19 29.5 27 32C35 34.5 43 38 43 47C43 55 36 60 26 60C14 60 8 54 8 46"
                stroke="#FFFFFF"
                strokeWidth="1.6"
                strokeDasharray="2.5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex flex-col leading-none">
            <span
              className={`font-black tracking-tight ${
                size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-2xl'
              }`}
              style={{ color: isDark ? '#FFFFFF' : '#0A192F' }}
            >
              mart <span className={isDark ? 'text-[#00D2FF]' : 'text-[#2563EB]'}>Masar</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
