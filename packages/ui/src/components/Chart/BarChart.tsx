'use client';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: any;
    name: string;
  }>;
  label?: string | number;
  tooltipFormatter?: (value: any, name: string) => [string, string];
}
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent"
/**
 * BarChart component for categorical data comparison
 */

import * as React from "react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from "recharts"
import { Chart, ChartProps } from "./Chart"
import { cn } from "../../lib/utils"

interface BarData {
  name: string
  [key: string]: string | number
}

interface BarConfig {
  dataKey: string
  name?: string
  color?: string
}

export interface BarChartProps extends Omit<ChartProps, "children"> {
  data: BarData[]
  bars: BarConfig[]
  xAxisKey?: string
  xAxisFormatter?: (value: any) => string
  yAxisFormatter?: (value: any) => string
  tooltipFormatter?: (value: any, name: string) => [string, string]
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  layout?: "horizontal" | "vertical"
  stackId?: string
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

const CustomTooltip = ({ active, payload, label, tooltipFormatter }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null
  }
  return (
    <div className="rounded-md border bg-background p-2 shadow-md">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {payload.map((entry: any, index: number) => {
        const [value, name] = tooltipFormatter
          ? tooltipFormatter(entry.value, entry.name)
          : [entry.value, entry.name]
        return (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-primary">{name}:</span>
            <span>{value}</span>
          </div>
        )
      })}
    </div>
  )
}

const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  ({
    data,
    bars,
    xAxisKey = "name",
    xAxisFormatter,
    yAxisFormatter = defaultYAxisFormatter,
    tooltipFormatter,
    showLegend = true,
    showGrid = true,
    showTooltip = true,
    layout = "vertical",
    stackId,
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
          <RechartsBarChart
            layout={layout}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
              />
            )}

            {layout === "vertical" ? (
              <>
                <XAxis
                  type="number"
                  tickFormatter={yAxisFormatter}
                  className="text-muted-foreground text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  tickFormatter={xAxisFormatter}
                  className="text-muted-foreground text-xs"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="category"
                  dataKey={xAxisKey}
                  tickFormatter={xAxisFormatter}
                  className="text-muted-foreground text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  tickFormatter={yAxisFormatter}
                  className="text-muted-foreground text-xs"
                  axisLine={false}
                  tickLine={false}
                />
              </>
            )}

            {showTooltip && (
              <Tooltip
                content={
                  <CustomTooltip tooltipFormatter={tooltipFormatter} />
                }
              />
            )}
            {showLegend && bars.length > 1 && (
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
                iconType="rect"
              />
            )}
            {bars.map((barConfig, index) => (
              <Bar
                key={barConfig.dataKey}
                dataKey={barConfig.dataKey}
                name={barConfig.name || barConfig.dataKey}
                fill={barConfig.color || `hsl(${index * 137.5 % 360}, 70%, 50%)`}
                stackId={stackId}
                radius={layout === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </Chart>
    )
  }
)

BarChart.displayName = "BarChart"

export { BarChart }
export type { BarData, BarConfig }
