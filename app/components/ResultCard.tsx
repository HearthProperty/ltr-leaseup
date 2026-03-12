'use client';

import { useState } from 'react';

interface ResultCardProps {
  finding: string;
  index: number;
}

const PREVIEW_LENGTH = 120;

export default function ResultCard({ finding, index }: ResultCardProps) {
  const needsTruncation = finding.length > PREVIEW_LENGTH;
  const [expanded, setExpanded] = useState(false);

  const displayText = !needsTruncation || expanded
    ? finding
    : finding.slice(0, PREVIEW_LENGTH).replace(/\s+\S*$/, '') + '…';

  return (
    <div
      className={`result-card glass-card animate-fade-in-up animate-delay-${index + 1}`}
    >
      <div className="result-card__icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2L12.09 7.26L18 8.27L14 12.14L14.18 18.02L10 15.77L5.82 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z"
            fill="currentColor"
            opacity="0.8"
          />
        </svg>
      </div>
      <div className="result-card__body">
        <p className="result-card__text">{displayText}</p>
        {needsTruncation && (
          <button
            className="result-card__toggle"
            onClick={() => setExpanded(!expanded)}
            type="button"
          >
            {expanded ? 'Show less' : 'Expand'}
          </button>
        )}
      </div>
    </div>
  );
}
