'use client';

/**
 * FunnelChart component for conversion funnel visualization
 */

import * as React from "react"
import { Chart, ChartProps } from "./Chart"
import { cn } from "../../lib/utils"

interface FunnelStage {
  name: string
  count: number
  conversionRate: number
  color?: string
}

export interface FunnelChartProps extends Omit<ChartProps, "children"> {
  data: FunnelStage[]
  valueFormatter?: (value: number) => string
  showPercentages?: boolean
  stageSpacing?: number
}

const defaultValueFormatter = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

const FunnelChart = React.forwardRef<HTMLDivElement, FunnelChartProps>(
  ({
    data,
    valueFormatter = defaultValueFormatter,
    showPercentages = true,
    stageSpacing = 8,
    className,
    ...chartProps
  }, ref) => {
    const isEmpty = !data || data.length === 0

    if (isEmpty) {
      return (
        <Chart
          ref={ref}
          className={className}
          isEmpty={true}
          {...chartProps}
        >
          <></>
        </Chart>
      )
    }

    // Find max count for width calculation
    const maxCount = Math.max(...data.map(stage => stage.count))

    return (
      <Chart
        ref={ref}
        className={cn("min-h-[400px]", className)}
        {...chartProps}
      >
        <div className="h-full flex flex-col justify-center p-4">
          <div className="space-y-1" style={{ gap: `${stageSpacing}px` }}>
            {data.map((stage, index) => {
              const widthPercentage = (stage.count / maxCount) * 100
              const color = stage.color || `hsl(${index * 137.5 % 360}, 70%, 50%)`

              return (
                <div key={stage.name} className="relative">
                  {/* Stage bar */}
                  <div className="relative">
                    <div
                      className="h-12 rounded-lg flex items-center justify-between px-4 text-white font-medium shadow-sm transition-all duration-300 hover:shadow-md"
                      style={{
                        backgroundColor: color,
                        width: `${Math.max(widthPercentage, 15)}%`, // Minimum width for readability
                      }}
                    >
                      <span className="text-sm font-medium truncate flex-1">
                        {stage.name}
                      </span>
                      <div className="text-right space-x-2 shrink-0">
                        <span className="text-sm font-bold">
                          {valueFormatter(stage.count)}
                        </span>
                        {showPercentages && index > 0 && (
                          <span className="text-xs opacity-90">
                            ({stage.conversionRate.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Conversion rate indicator */}
                    {showPercentages && index > 0 && (
                      <div className="absolute -right-16 top-1/2 transform -translate-y-1/2">
                        <div className="text-xs text-muted-foreground font-medium">
                          {stage.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connecting arrow */}
                  {index < data.length - 1 && (
                    <div
                      className="flex items-center justify-center"
                      style={{ height: `${stageSpacing * 2}px` }}
                    >
                      <div className="text-muted-foreground">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 2L8 14M8 14L4 10M8 14L12 10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Summary */}
          {data.length > 1 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Overall conversion:
                </span>
                <span className="font-medium">
                  {data.length > 0 && (
                    `${((data[data.length - 1].count / data[0].count) * 100).toFixed(2)}%`
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </Chart>
    )
  }
)

FunnelChart.displayName = "FunnelChart"

export { FunnelChart }
export type { FunnelStage }
