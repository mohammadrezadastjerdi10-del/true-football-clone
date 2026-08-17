import { cn } from "@/lib/utils";

/** Classic black-and-white football on a pitch-green tile. */
export function BrandMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tf-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.66 0.14 152)" />
          <stop offset="100%" stopColor="oklch(0.4 0.12 155)" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#tf-tile)" />
      <circle cx="24" cy="24" r="14" fill="oklch(0.98 0.01 170)" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="oklch(1 0 0 / 0.25)" strokeWidth="1" />
      <path
        fill="oklch(0.13 0.02 160)"
        d="M24 24 L26.94 14.97 L21.06 14.97 Z M24 24 L16.31 18.41 L14.5 24 Z M24 24 L16.31 29.59 L21.06 33.03 Z M24 24 L26.94 33.03 L31.69 29.59 Z M24 24 L33.5 24 L31.69 18.41 Z"
      />
      <polygon
        fill="oklch(0.13 0.02 160)"
        points="24,19.5 19.72,22.61 21.35,27.64 26.65,27.64 28.28,22.61"
      />
    </svg>
  );
}

export function BrandWordmark({
  className,
  markSize = 30,
  sub,
}: {
  className?: string;
  markSize?: number;
  sub?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={markSize} />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          True Football
        </span>
        {sub && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}
