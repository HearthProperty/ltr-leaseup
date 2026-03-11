interface ResultCardProps {
  finding: string;
  index: number;
}

export default function ResultCard({ finding, index }: ResultCardProps) {
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
      <p className="result-card__text">{finding}</p>
    </div>
  );
}
