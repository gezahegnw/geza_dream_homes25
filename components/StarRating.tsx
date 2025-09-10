"use client";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  id?: string;
}

export default function StarRating({ value, onChange, size = 24, readOnly = false, id }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-labelledby={id}>
      {stars.map((star) => {
        const active = (hover ?? value) >= star;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => !readOnly && onChange?.(star)}
            className="p-0.5 disabled:cursor-default"
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill={active ? "#f59e0b" : "#e5e7eb"}
              width={size}
              height={size}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
