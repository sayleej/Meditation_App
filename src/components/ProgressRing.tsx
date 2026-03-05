type ProgressRingProps = {
  progress: number;
  label: string;
};

export function ProgressRing({ progress, label }: ProgressRingProps) {
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeOffset = circumference * (1 - clampedProgress);

  return (
    <div className="ring-wrap" aria-label={label} role="img">
      <svg className="ring" viewBox="0 0 260 260">
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx="130" cy="130" r={radius} />
        <circle
          className="ring-progress"
          cx="130"
          cy="130"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
        />
      </svg>
    </div>
  );
}
