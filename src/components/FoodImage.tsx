import React, { useState } from 'react';
import { Leaf } from 'lucide-react';
import { getIngredientVisualHref } from '../data/ingredientVisuals';
import { getIngredientImage } from '../utils/imageService';

interface FoodImageProps {
  name: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  name,
  alt = name,
  className = '',
  imageClassName = '',
}) => {
  const [failed, setFailed] = useState(false);
  const ingredientVisualHref = getIngredientVisualHref(name);
  const dynamicImageUrl = getIngredientImage(name);

  if (ingredientVisualHref) {
    return (
      <span className={`flex items-center justify-center overflow-hidden bg-[#E6EFE5] ${className}`}>
        <svg
          viewBox="0 0 160 120"
          className={`h-[88%] w-[88%] ${imageClassName}`}
          role="img"
          aria-label={alt}
        >
          <use href={ingredientVisualHref} />
        </svg>
      </span>
    );
  }

  if (failed || !dynamicImageUrl) {
    return (
      <span className={`flex items-center justify-center bg-[#E6EFE5] text-[#3C7454] ${className}`} aria-hidden="true">
        <Leaf className="h-1/3 w-1/3" strokeWidth={1.5} />
      </span>
    );
  }

  return (
    <span className={`block overflow-hidden bg-[#E6EFE5] ${className}`}>
      <img
        src={dynamicImageUrl}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover ${imageClassName}`}
        onError={() => setFailed(true)}
      />
    </span>
  );
};

export default FoodImage;