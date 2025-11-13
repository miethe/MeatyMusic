import * as React from "react";
import { cn } from "../../../lib/utils";

export interface SuccessSparklineProps {
  /** Array of success rates (0-1) representing trend data */
  data: number[];
  /** Width of the sparkline in pixels */
  width?: number;
  /** Height of the sparkline in pixels */
  height?: number;
  /** Additional CSS class names */
  className?: string;
  /** Custom style object for CSS custom properties */
  style?: React.CSSProperties;
  /** Whether to show "No data" label in empty state */
  showEmptyLabel?: boolean;
}

/**
 * Generates an SVG path string from data points
 * @param data Array of numeric values (0-1)
 * @param width SVG viewBox width
 * @param height SVG viewBox height
 * @returns SVG path string
 */
const generatePath = (data: number[], width: number, height: number): string => {
  if (data.length === 0) return "";

  // Handle single data point
  if (data.length === 1) {
    const y = height - (data[0] * height);
    return `M ${width / 2} ${y} L ${width / 2} ${y}`;
  }

  // Calculate step size for x-axis
  const stepX = width / (data.length - 1);

  // Generate path points
  const pathCommands = data.map((value, index) => {
    const x = index * stepX;
    const y = height - (value * height); // Invert Y for SVG coordinate system
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  });

  return pathCommands.join(" ");
};

/**
 * Analyzes trend direction for accessibility description
 * @param data Array of numeric values
 * @returns Trend description string
 */
const analyzeTrend = (data: number[]): string => {
  if (data.length <= 1) return "no trend data";

  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;

  // Check if all values are the same (flat trend)
  const isFlat = data.every(value => Math.abs(value - first) < 0.01);
  if (isFlat) return "stable trend";

  if (Math.abs(diff) < 0.05) return "stable trend";
  if (diff > 0.05) return "increasing trend";
  if (diff < -0.05) return "decreasing trend";

  return "stable trend";
};

/**
 * Formats success rate percentage for screen readers
 * @param data Array of success rates
 * @returns Formatted description
 */
const formatDataDescription = (data: number[]): string => {
  if (data.length === 0) return "No success rate data available";

  const percentages = data.map(rate => Math.round(rate * 100));
  const min = Math.min(...percentages);
  const max = Math.max(...percentages);
  const latest = percentages[percentages.length - 1];

  return `Success rate trend from ${min}% to ${max}%, currently ${latest}%`;
};

export const SuccessSparkline = React.memo<SuccessSparklineProps>(({
  data,
  width = 60,
  height = 24,
  className,
  style,
  showEmptyLabel = false,
}) => {
  const gridId = React.useId();
  const svgPath = React.useMemo(() => {
    return generatePath(data, width, height);
  }, [data, width, height]);

  const trendDescription = React.useMemo(() => {
    return analyzeTrend(data);
  }, [data]);

  const dataDescription = React.useMemo(() => {
    return formatDataDescription(data);
  }, [data]);

  // Handle empty data case
  if (data.length === 0) {
    return (
      <div
        className={cn("inline-flex items-center justify-center", className)}
        style={{ width, height, ...style }}
        role="img"
        aria-label="No success rate data available"
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-hidden"
          aria-hidden="true"
        >
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="var(--mp-color-text-muted)"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />
          {showEmptyLabel && (
            <text
              x={width / 2}
              y={height / 2 + 3}
              textAnchor="middle"
              fontSize="8"
              fill="var(--mp-color-text-muted)"
              fontFamily="var(--mp-font-sans)"
            >
              No data
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Handle single data point case
  if (data.length === 1) {
    const dotY = height - (data[0] * height);
    return (
      <div
        className={cn("inline-flex items-center justify-center", className)}
        style={{ width, height, ...style }}
        role="img"
        aria-label={`Success rate: ${Math.round(data[0] * 100)}%`}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-hidden"
        >
          <circle
            cx={width / 2}
            cy={dotY}
            r="1.5"
            fill="var(--mp-color-success, var(--mp-color-primary))"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center", className)}
      style={{ width, height, ...style }}
      role="img"
      aria-label={`${dataDescription}. ${trendDescription}.`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
        style={{
          // Respect reduced motion preferences
          transition: 'var(--mp-motion-duration-ui, 150ms) ease-out',
        }}
      >
        {/* Background grid for context (subtle) */}
        <defs>
          <pattern
            id={`sparkline-grid-${gridId}`}
            width={width / 4}
            height={height / 2}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${width / 4} 0 v ${height / 2} M 0 ${height / 2} h ${width / 4}`}
              fill="none"
              stroke="var(--mp-color-border)"
              strokeWidth="0.5"
              opacity="0.1"
            />
          </pattern>
        </defs>

        <rect
          width={width}
          height={height}
          fill={`url(#sparkline-grid-${gridId})`}
        />

        {/* Main sparkline path */}
        <path
          d={svgPath}
          fill="none"
          stroke="var(--mp-color-success, var(--mp-color-primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            // Smooth animation for path changes
            transition: 'var(--mp-motion-duration-ui, 150ms) ease-out',
          }}
        />

        {/* Data point indicators for accessibility */}
        {data.map((value, index) => {
          const x = index * (width / (data.length - 1));
          const y = height - (value * height);

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1"
              fill="var(--mp-color-success, var(--mp-color-primary))"
              opacity="0.8"
            />
          );
        })}
      </svg>
    </div>
  );
});

SuccessSparkline.displayName = "SuccessSparkline";
