/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { resolvePublicImageUrl } from '../../utils/imageUrl';

interface EmployeeAvatarProps {
  employee: Pick<
    Employee,
    'nameAr' | 'initials' | 'avatarUrl' | 'image_url' | 'image_file_id' | 'image_alt_ar'
  >;
  className?: string;
  imgClassName?: string;
}

export const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  employee,
  className = '',
  imgClassName = 'w-full h-full object-cover',
}) => {
  const resolvedUrl = resolvePublicImageUrl(
    employee.image_url || employee.avatarUrl,
    employee.image_file_id
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedUrl]);

  const showImage = Boolean(resolvedUrl) && !hasError;

  return (
    <div className={className}>
      {showImage ? (
        <img
          src={resolvedUrl}
          alt={employee.image_alt_ar || employee.nameAr}
          onError={() => setHasError(true)}
          className={imgClassName}
          loading="lazy"
        />
      ) : (
        <span className="tracking-wider select-none">{employee.initials}</span>
      )}
    </div>
  );
};
