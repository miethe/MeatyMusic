'use client';

/**
 * LineChart component for time series data
 */

import * as React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from "recharts"
import { format, parseISO } from "date-fns"
import { Chart, ChartProps } from "./Chart"
import { cn } from "../../lib/utils"

interface LineData {
  timestamp: string | Date
  [key: string]: string | number | Date
}

interface LineConfig {
  dataKey: string
  name?: string
  color?: string
  strokeWidth?: number
  strokeDasharray?: string
}

export interface LineChartProps extends Omit<ChartProps, "children"> {
  data: LineData[]
  lines: LineConfig[]
  xAxisKey?: string
  xAxisFormatter?: (value: any) => string
  yAxisFormatter?: (value: any) => string
  tooltipFormatter?: (value: any, name: string) => [string, string]
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  syncId?: string
}

const defaultXAxisFormatter = (value: any): string => {
  try {
    if (typeof value === 'string') {
      return format(parseISO(value), 'MMM dd, HH:mm')
    }
    if (value instanceof Date) {
      return format(value, 'MMM dd, HH:mm')
    }
    return String(value)
  } catch {
    return String(value)
  }
}

const defaultYAxisFormatter = (value: any): string => {
  if (typeof value === 'number') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString()
  }
  return String(value)
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: any;
    name: string;
    color?: string;
    dataKey?: string;
  }>;
  label?: string | number;
  xAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, xAxisFormatter, tooltipFormatter }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const formattedLabel = xAxisFormatter ? xAxisFormatter(label) : String(label)

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 space-y-2">
      <p className="font-medium text-sm text-foreground">{formattedLabel}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const safeName = entry.name ?? entry.dataKey ?? '';
          const [formattedValue, formattedName] = tooltipFormatter
            ? tooltipFormatter(entry.value, safeName)
            : [String(entry.value), safeName]

          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{formattedName}:</span>
              <span className="font-medium text-foreground">{formattedValue}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({
    data,
    lines,
    xAxisKey = "timestamp",
    xAxisFormatter = defaultXAxisFormatter,
    yAxisFormatter = defaultYAxisFormatter,
    tooltipFormatter,
    showLegend = true,
    showGrid = true,
    showTooltip = true,
    syncId,
    className,
    ...chartProps
  }, ref) => {
    const isEmpty = !data || data.length === 0

    return (
      <Chart
        ref={ref}
        className={cn("min-h-[300px]", className)}
        isEmpty={isEmpty}
        {...chartProps}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            syncId={syncId}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
              />
            )}
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={xAxisFormatter}
              className="text-muted-foreground text-xs"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              className="text-muted-foreground text-xs"
              axisLine={false}
              tickLine={false}
            />
            {showTooltip && (
              <Tooltip
                content={
                  <CustomTooltip
                    xAxisFormatter={xAxisFormatter}
                    tooltipFormatter={tooltipFormatter}
                  />
                }
              />
            )}
            {showLegend && (
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
                iconType="line"
              />
            )}
            {lines.map((lineConfig, index) => (
              <Line
                key={lineConfig.dataKey}
                type="monotone"
                dataKey={lineConfig.dataKey}
                name={lineConfig.name || lineConfig.dataKey}
                stroke={lineConfig.color || `hsl(${index * 137.5 % 360}, 70%, 50%)`}
                strokeWidth={lineConfig.strokeWidth || 2}
                strokeDasharray={lineConfig.strokeDasharray}
                dot={{ r: 3 }}
                activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </Chart>
    )
  }
)

LineChart.displayName = "LineChart"

export { LineChart }
export type { LineData, LineConfig }
