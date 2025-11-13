import * as React from "react";
import { cn } from "../../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gradient-to-r from-text-muted/10 via-text-muted/20 to-text-muted/10 bg-size-200 animate-shimmer", className)}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
      {...props}
    />
  );
}

interface LoadingSkeletonProps {
  /** Height of the skeleton */
  height?: string;
  /** Width of the skeleton */
  width?: string | number;
  /** Number of lines for text skeleton */
  lines?: number;
  /** Whether to show shimmer animation */
  shimmer?: boolean;
  /** Whether skeleton is circular */
  circular?: boolean;
  /** Animation timing */
  timing?: "micro" | "ui" | "panel" | "modal";
  /** Custom className */
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  height = "1rem",
  width = "100%",
  lines = 1,
  shimmer = true,
  circular = false,
  timing = "ui",
  className = "",
}) => {
  const baseClass = cn(
    "bg-gradient-to-r from-text-muted/10 via-text-muted/20 to-text-muted/10",
    {
      "animate-pulse": !shimmer,
      "rounded-full": circular,
      "rounded-md": !circular,
    },
    shimmer && "bg-size-200 animate-shimmer",
    className
  );

  const style = {
    height,
    width: typeof width === "number" ? `${width}px` : width,
    ...(shimmer && {
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
    }),
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={baseClass}
            style={{
              ...style,
              width: index === lines - 1 && lines > 1 ? "75%" : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={baseClass} style={style} />;
};

export { Skeleton, LoadingSkeleton };
