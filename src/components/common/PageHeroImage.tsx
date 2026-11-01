/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { resolvePublicImageUrl } from '../../utils/imageUrl';

interface PageHeroImageProps {
  pageId: string;
  className?: string;
}

export const PageHeroImage: React.FC<PageHeroImageProps> = ({ pageId, className = '' }) => {
  const { pages } = useApp();
  const pageMeta = pages.find((p) => p.id === pageId);
  const resolvedUrl = resolvePublicImageUrl(
    pageMeta?.hero_image_url,
    pageMeta?.hero_image_file_id
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedUrl]);

  if (!resolvedUrl || hasError) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border-2 border-[#00D2FF]/40 bg-[#0A192F]/80 shadow-xl shrink-0 ${className}`}
    >
      <img
        src={resolvedUrl}
        alt={pageMeta?.hero_image_alt_ar || pageMeta?.titleAr || 'صورة الصفحة'}
        onError={() => setHasError(true)}
        className="w-full h-44 sm:h-52 md:w-72 lg:w-80 object-cover"
        loading="lazy"
      />
    </div>
  );
};
