import { useId } from "react";
import { cn } from "@/lib/utils";

/** Chargebee mark with orange → active-blue gradient fill. */
export function CbLogoGradient({
  className,
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="12"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--color-cb-orange)" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path d="M12 7.88164V12H7.84264L3.97746 5.99453L12 7.88164Z" fill={`url(#${gradientId})`} />
      <path d="M5.15726 11.9336C3.66295 11.7338 2.3484 10.9788 1.41583 9.89102L3.97746 5.99453L5.15726 11.9336Z" fill={`url(#${gradientId})`} />
      <path d="M3.97746 5.99453L0.179895 7.34883C0.0563017 6.89369 0 6.41617 0 5.92773C1.3741e-05 5.48384 0.0560453 5.05101 0.145893 4.6293L3.97746 5.99453Z" fill={`url(#${gradientId})`} />
      <path d="M12 4.10742L3.97746 5.99453L7.84264 0H12V4.10742Z" fill={`url(#${gradientId})`} />
      <path d="M3.97746 5.99453L1.41583 2.09805C2.3484 1.01018 3.66292 0.266382 5.15726 0.0554688L3.97746 5.99453Z" fill={`url(#${gradientId})`} />
    </svg>
  );
}
