import { useEffect, useId, useState } from "react";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

type BlobSpec = {
  r: number;
  fill: string;
  cx: number;
  cy: number;
  cxValues: string;
  cyValues: string;
  cxKeyTimes: string;
  cyKeyTimes: string;
  cxKeySplines: string;
  cyKeySplines: string;
  dur: string;
};

const BLOBS: BlobSpec[] = [
  {
    r: 15,
    fill: "grad-red",
    cx: 2,
    cy: 4,
    cxValues: "2;20;25;14;2",
    cyValues: "4;2;14;25;4",
    cxKeyTimes: "0;0.28;0.55;0.8;1",
    cyKeyTimes: "0;0.28;0.55;0.8;1",
    cxKeySplines:
      "0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1",
    cyKeySplines:
      "0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1",
    dur: "11s",
  },
  {
    r: 13,
    fill: "grad-orange",
    cx: 23,
    cy: 21,
    cxValues: "23;5;2;18;23",
    cyValues: "21;23;7;4;21",
    cxKeyTimes: "0;0.25;0.6;0.85;1",
    cyKeyTimes: "0;0.25;0.6;0.85;1",
    cxKeySplines:
      "0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1",
    cyKeySplines:
      "0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1",
    dur: "13s",
  },
  {
    r: 14,
    fill: "grad-redorange",
    cx: 16,
    cy: 8,
    cxValues: "16;3;9;24;16",
    cyValues: "8;16;24;6;8",
    cxKeyTimes: "0;0.3;0.6;0.85;1",
    cyKeyTimes: "0;0.3;0.6;0.85;1",
    cxKeySplines: "0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1",
    cyKeySplines: "0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1",
    dur: "15s",
  },
  {
    r: 11,
    fill: "grad-magenta",
    cx: 10,
    cy: 19,
    cxValues: "10;22;15;3;10",
    cyValues: "19;12;2;20;19",
    cxKeyTimes: "0;0.3;0.6;0.85;1",
    cyKeyTimes: "0;0.3;0.6;0.85;1",
    cxKeySplines: "0.5 0 0.5 1; 0.5 0 0.5 1; 0.5 0 0.5 1; 0.5 0 0.5 1",
    cyKeySplines: "0.5 0 0.5 1; 0.5 0 0.5 1; 0.5 0 0.5 1; 0.5 0 0.5 1",
    dur: "9s",
  },
  {
    r: 14,
    fill: "grad-cyan",
    cx: 13,
    cy: 2,
    cxValues: "13;26;19;3;13",
    cyValues: "2;14;26;15;2",
    cxKeyTimes: "0;0.3;0.55;0.85;1",
    cyKeyTimes: "0;0.3;0.55;0.85;1",
    cxKeySplines:
      "0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1",
    cyKeySplines:
      "0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1",
    dur: "17s",
  },
  {
    r: 16,
    fill: "grad-blue",
    cx: -1,
    cy: 13,
    cxValues: "-1;15;28;10;-1",
    cyValues: "13;28;13;-1;13",
    cxKeyTimes: "0;0.25;0.55;0.8;1",
    cyKeyTimes: "0;0.25;0.55;0.8;1",
    cxKeySplines: "0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1",
    cyKeySplines: "0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1",
    dur: "19s",
  },
  {
    r: 15,
    fill: "grad-accent",
    cx: 20,
    cy: 6,
    cxValues: "20;7;-2;14;20",
    cyValues: "6;-1;14;28;6",
    cxKeyTimes: "0;0.3;0.6;0.85;1",
    cyKeyTimes: "0;0.3;0.6;0.85;1",
    cxKeySplines: "0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1",
    cyKeySplines: "0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1",
    dur: "23s",
  },
];

export type AssistantProfileIconVariant = "light" | "dark";

const VARIANT_CONFIG = {
  light: {
    baseFill: "#A2C1C4",
    magenta: "#E91E63",
    blue: "#3D5AFE",
    accentId: "grad-deepblue",
    accentColor: "#1A237E",
  },
  dark: {
    baseFill: "#3D4470",
    magenta: "#FF4081",
    blue: "#536DFE",
    accentId: "grad-indigo",
    accentColor: "#9FA8DA",
  },
} as const;

type AssistantProfileIconProps = {
  className?: string;
  /** `light` for pale backgrounds; `dark` for workspace chrome on dark tabs. */
  variant?: AssistantProfileIconVariant;
  /** When false, blobs stay at their initial positions. */
  animated?: boolean;
};

/**
 * Animated CB swirl avatar (blurred gradient blobs clipped to the mark).
 */
export function AssistantProfileIcon({
  className = "h-4 w-4",
  variant = "light",
  animated = true,
}: AssistantProfileIconProps) {
  const uid = useId().replace(/:/g, "");
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionOn = animated && !prefersReducedMotion;
  const config = VARIANT_CONFIG[variant];

  const id = (name: string) => `${uid}-${name}`;

  const resolveFill = (fill: string) => {
    if (fill === "grad-accent") return config.accentId;
    return fill;
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-3.1 -2.25 32 32"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      data-variant={variant}
      className={`block shrink-0 ${className}`}
    >
      <defs>
        <clipPath id={id("logoClip")} clipPathUnits="userSpaceOnUse">
          <path d="M8.54688 13.7513L25.8012 9.63644V0.689087H16.8539L8.54688 13.7513Z" />
          <path d="M0 13.5961C0 14.6665 0.130477 15.7055 0.376933 16.701L8.55107 13.7532L0.309279 10.7788C0.108731 11.6849 0 12.6272 0 13.5937V13.5961Z" />
          <path d="M3.03906 5.27499L8.54809 13.7512L11.0876 0.817017C7.87154 1.26885 5.03729 2.90707 3.03906 5.27499Z" />
          <path d="M8.55078 13.7517L25.8051 17.8642V26.8115H16.8578L8.55078 13.7517Z" />
          <path d="M3.03953 22.2246L8.54855 13.7484L11.0856 26.6801C7.86959 26.2283 5.03534 24.5901 3.03711 22.2222L3.03953 22.2246Z" />
        </clipPath>

        <filter id={id("blob-blur")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>

        <radialGradient id={id("grad-red")}>
          <stop offset="0%" stopColor="#FF1744" stopOpacity="1" />
          <stop offset="65%" stopColor="#FF1744" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF1744" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("grad-orange")}>
          <stop offset="0%" stopColor="#FF6D00" stopOpacity="1" />
          <stop offset="65%" stopColor="#FF6D00" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF6D00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("grad-redorange")}>
          <stop offset="0%" stopColor="#FF3D00" stopOpacity="1" />
          <stop offset="65%" stopColor="#FF3D00" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF3D00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("grad-magenta")}>
          <stop offset="0%" stopColor={config.magenta} stopOpacity="1" />
          <stop offset="65%" stopColor={config.magenta} stopOpacity="0.75" />
          <stop offset="100%" stopColor={config.magenta} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("grad-cyan")}>
          <stop offset="0%" stopColor="#00B0FF" stopOpacity="1" />
          <stop offset="65%" stopColor="#00B0FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00B0FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("grad-blue")}>
          <stop offset="0%" stopColor={config.blue} stopOpacity="1" />
          <stop offset="65%" stopColor={config.blue} stopOpacity="0.8" />
          <stop offset="100%" stopColor={config.blue} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id(config.accentId)}>
          <stop offset="0%" stopColor={config.accentColor} stopOpacity="1" />
          <stop offset="65%" stopColor={config.accentColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={config.accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${id("logoClip")})`}>
        <rect x="-5" y="-5" width="40" height="40" fill={config.baseFill} />

        <g filter={`url(#${id("blob-blur")})`}>
          {BLOBS.map((blob, index) => {
            const fillId = resolveFill(blob.fill);
            return (
              <circle
                key={`${variant}-${index}`}
                r={blob.r}
                cx={blob.cx}
                cy={blob.cy}
                fill={`url(#${id(fillId)})`}
              >
                {motionOn && (
                  <>
                    <animate
                      attributeName="cx"
                      values={blob.cxValues}
                      keyTimes={blob.cxKeyTimes}
                      calcMode="spline"
                      keySplines={blob.cxKeySplines}
                      dur={blob.dur}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values={blob.cyValues}
                      keyTimes={blob.cyKeyTimes}
                      calcMode="spline"
                      keySplines={blob.cyKeySplines}
                      dur={blob.dur}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            );
          })}
        </g>
      </g>
    </svg>
  );
}

/** Dark-background swirl for workspace chrome (top bar on gradient). */
export function AssistantProfileIconDark(
  props: Omit<AssistantProfileIconProps, "variant">,
) {
  return <AssistantProfileIcon {...props} variant="dark" />;
}
